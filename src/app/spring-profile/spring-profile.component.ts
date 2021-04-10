import { ProfileDataTO } from './../shared/models/ProfileDataTO';
import { ProfileSpecTO } from './../shared/models/ProfileSpecTO';
import { ProfileAggregatorService } from './../shared/profile-aggregator/profile-aggregator.service';
import { Component, OnInit, Renderer2 } from '@angular/core';
import * as CodeMirror from 'codemirror';
import * as yaml from 'js-yaml';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import 'codemirror/mode/yaml/yaml';
import 'codemirror/lib/codemirror';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/yaml-lint';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/fold/foldcode';

import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

@Component({
  selector: 'app-spring-profile',
  templateUrl: './spring-profile.component.html',
  styleUrls: ['./spring-profile.component.scss']
})
export class SpringProfileComponent implements OnInit {

  SPACES_TO_ONE_TAB = 2;

  IS_DRAGGABLE = true;

  CODEMIRROR_CONFIG: any = {
    theme: 'idea',
    mode: 'yaml',
    lineNumbers: true,
    foldGutter: true,
    tabSize: this.SPACES_TO_ONE_TAB,
    indentUnit: this.SPACES_TO_ONE_TAB,
    indentWithTabs: true,
    gutters: [
      'CodeMirror-linenumbers',
      'CodeMirror-foldgutter',
      'CodeMirror-lint-markers'
    ],
    autoCloseBrackets: true,
    matchBrackets: true,
    autofocus: true
  };

  private profileYAMLLoaded = new Set();

  isCollapse = true;

  private profileToContentMapper = new Map();
  private profileErrorMessage = new Map();
  private profilesSet = new Set();
  private profiles: ProfileDataTO[] = [];
  private profileIndex = -1;

  private aggregatedContent = '';
  private SPACE_REPLACE = '';

  private currentLineInEditor = 0;

  private lineToPropertyBreadcrumbMap: any;
  private propertyTolineBreadcrumbMap: any;
  private breadcrumbEditorLine = -1;
  private mergeEditor: any;

  constructor(private renderer: Renderer2, private profileAggregateService: ProfileAggregatorService) {
    this.SPACE_REPLACE = ' '.repeat(this.SPACES_TO_ONE_TAB);
  }

  drop(event: CdkDragDrop<string[]>): void {
    if (this.profileIndex !== -1) {
      this.profileIndex = event.currentIndex;
    }
    moveItemInArray(this.profiles, event.previousIndex, event.currentIndex);
  }

  ngOnInit(): void {
    this.profileIndex = -1;

    console.log('ngOnInit');
  }

  toggleEnableDrag(): void {
    this.IS_DRAGGABLE = !this.IS_DRAGGABLE;
  }

  getProfileIndex(): number {
    return this.profileIndex;
  }

  getAggregatedContent(): string {
    return this.aggregatedContent;
  }

  uploadFiles(event: any): void {

    for (const file of event.target.files) {
      if (!this.profilesSet.has(file.name)) {
        this.profilesSet.add(file.name);
        this.profiles.push(new ProfileDataTO(file));
        this.aggregatedContent = '';

        const index = this.profiles.length - 1;

        const reader = new FileReader();
        reader.onload = (e: any) => {
          const content = e?.target?.result || '';

          this.profileToContentMapper.set(file.name,
            this.replaceAll(content, '\t', this.SPACE_REPLACE)
          );

          const divStatus = document.getElementById('profile-expand-status-' + index);
          this.updateCssValidate(divStatus, file, content);
        };
        reader.readAsText(file);
      }
    }
  }

  fileChooserExecute(fileChooser: any): void {
    fileChooser.value = '';
    fileChooser.click();
  }


  printData(): void {
    console.log(this.getProfiles());
    console.log(this.profilesSet);
  }

  getProfiles(): ProfileDataTO[] {
    return this.profiles;
  }

  removeFile(index: number, file: File): void {

    this.profiles = this.profiles.filter((_, i) => i !== index);

    this.profileToContentMapper.delete(file.name);
    this.profileYAMLLoaded.delete(file.name);
    this.profilesSet.delete(file.name);

    if (this.profileIndex === index) {
      this.ngOnInit();
    }
    else if (this.profileIndex > index) {
      this.profileIndex -= 1;
    }

    if (this.getProfiles().length === 0) {
      this.aggregatedContent = '';
    }
  }

  clearFiles(): void {
    this.profileToContentMapper.clear();
    this.profileYAMLLoaded.clear();
    this.profilesSet.clear();
    this.profiles = [];

    this.ngOnInit();
    this.aggregatedContent = '';
  }

  collapseProfileExceptIndex(index: number): any {

    let currentProfile = null;
    let i = 0;
    for (const profileData of this.getProfiles()) {
      if (i !== index) {
        profileData.isCollapsed = true;
      }
      else {
        currentProfile = profileData;
        profileData.isCollapsed = !profileData.isCollapsed;
      }
      ++i;
    }
    return currentProfile;
  }

  updateYAML(file: File, id: string, index: number): void {

    const currentProfile = this.collapseProfileExceptIndex(index);
    if (currentProfile && currentProfile.isCollapsed) {
      this.ngOnInit();
      return;
    }

    this.profileIndex = index;

    if (!this.profileYAMLLoaded.has(file.name)) {

      const codemirror = CodeMirror.fromTextArea(document.getElementById(id) as HTMLTextAreaElement,
      this.CODEMIRROR_CONFIG
      );
      codemirror.setSize('100%', 350);

      const divStatus = document.getElementById('profile-expand-status-' + index);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e?.target?.result || '';
        codemirror.setValue(content);
        codemirror.refresh();

        this.updateCssValidate(divStatus, file, content);
      };
      reader.readAsText(file);
      this.profileYAMLLoaded.add(file.name);

      codemirror.on('change', (event) => {

        const content = this.replaceAll(event.getValue(), '\t', this.SPACE_REPLACE);
        this.profileToContentMapper.set(file.name, content);

        this.updateCssValidate(divStatus, file, content);
      });
    }
  }

  updateCssValidate(divStatus: any, file: File, content: string): void {
    if (this.validateYAML(file, content)) {
      this.toggleValidInValid(divStatus, 'bg-warning', 'bg-success');
    }
    else {
      this.toggleValidInValid(divStatus, 'bg-success', 'bg-warning');
    }
  }

  replaceAll(data: string, search: string, replace: string): string {
    return data.split(search).join(replace);
  }

  toggleValidInValid(div: any, removeClass: string, addClass: string): void {
    div.classList.remove(removeClass);
    div.classList.add(addClass);
  }

  isProfileYAMLLoaded(file: File): boolean {
    return this.profileYAMLLoaded.has(file.name);
  }

  validateYAML(file: File, content: string): boolean {
    try {
      yaml.load(content);
      this.profileErrorMessage.delete(file.name);
      return true;
    }
    catch (e) {
      this.profileErrorMessage.set(file.name, e.message);
    }
    return false;
  }

  getProfileErrorMessage(file: File): any {

    const error = this.profileErrorMessage.get(file.name);
    return Boolean(error) ? error : null;
  }

  aggregateProfiles(): void {

    if (this.getProfiles().length === 0) {
      return;
    }
    this.collapseProfileExceptIndex(-1);

    const profileAggregateList: ProfileSpecTO[] = [];

    this.profiles.forEach((profileDataTO: ProfileDataTO) => {
      profileAggregateList.push(
        new ProfileSpecTO(profileDataTO.file.name,
        this.profileToContentMapper.get(profileDataTO.file.name), profileDataTO.color)
      );
    });

    this.aggregatedContent = '';
    this.profileAggregateService.aggregateProfile(profileAggregateList).subscribe(
      (response: ProfileSpecTO) => {
        const parent = document.getElementById('display-aggregate');
        if (parent) {
          parent.innerHTML = '<textarea id="aggregate-textarea-content"></textarea>';
        }

        const modifyConfig = JSON.parse(JSON.stringify(this.CODEMIRROR_CONFIG));
        modifyConfig.readOnly = true;
        modifyConfig.foldGutter = false;

        const codemirror = CodeMirror.fromTextArea(document.getElementById('aggregate-textarea-content') as HTMLTextAreaElement,
        modifyConfig
        );

        this.mergeEditor = codemirror;

        codemirror.on('dblclick', (instance: any, event: Event) => {
          this.breadcrumbEditorLine = instance.getCursor().line + 1;
        });

        const jsonObject  = response.jsonContent;
        const jsonContent = JSON.stringify(jsonObject, null, this.SPACES_TO_ONE_TAB);
        this.aggregatedContent = jsonContent;

        setTimeout(() => {

          codemirror.setValue(this.aggregatedContent);
          codemirror.setSize('100%', '100%');
          codemirror.refresh();

          setTimeout(() => {
            this.updateCodeMirrorVisual(codemirror, response.propertyList, jsonObject);
          }, 500);
        }, 500);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  updateCodeMirrorVisual(doc: any, propertyList: any, jsonObject: any): void {

    const parent = document.getElementById('display-aggregate');
    const lineElements = parent?.getElementsByClassName('CodeMirror-linenumber CodeMirror-gutter-elt');
    if (lineElements) {

      const profileMapper = new Map();
      this.currentLineInEditor = 2;

      this.lineToPropertyBreadcrumbMap = new Map();
      this.propertyTolineBreadcrumbMap = new Map();
      this.breadcrumbEditorLine = -1;

      // console.log(jsonObject);
      this.getLineOfEachPropertyValue('', jsonObject, profileMapper, false);

      // console.log(this.lineToPropertyBreadcrumbMap);

      const profileColorMap = new Map(this.getProfiles().map(i => [i.file.name, i.color]));

      // console.log(propertyList);
      // console.log(profileMapper);
      for (let i = 0; i < propertyList.length; ++i) {
        const prop = propertyList[i];
        const lineNumber = profileMapper.get(prop.property);
        this.updateColor(lineElements[lineNumber], profileColorMap.get(prop.owner));
      }

      this.getProfiles().forEach((profile, index) => {
        this.updateColor(document.getElementById(`side-bar-${index}`), profile.color);
      });
    }
  }

  updateColor(element: any, color: any): void {
    if (element) {
      element.style['background-color'] = color;
    }
  }

  ////////////////////// CODE MIRROR VISUAL CHANGE

  highlightLineInDoc(lineNumber: number, doc: any): void {
    doc.markText({line: lineNumber, ch: 0}, {line: lineNumber, ch: 1000}, {
      css: 'background-color: red'
    });
  }

  getLineOfEachPropertyValue(path: string, root: any,  profileMapper: any, isArray: boolean): void {

    // console.log(1, path, root, `line : ${this.currentLineInEditor}`);

    const parentIndex = this.currentLineInEditor;
    for (const pro of Object.keys(root)) {
      const val = root[pro];
      const newPath = this.generatePropertyPath(path, pro);

      if (this.propertyType(val) === 'primitive' && isArray) {
        profileMapper.set(path, parentIndex - 1);
        // console.log(`2 line : ${parentIndex - 1} >> ${path} = ${val}`);
        this.lineToPropertyBreadcrumbMap.set(this.currentLineInEditor, `${newPath}.${val}`);
        this.propertyTolineBreadcrumbMap.set(`${newPath}.${val}`, this.currentLineInEditor);
        // console.log(`${newPath}.${val} = line : ${this.currentLineInEditor}`);
        ++this.currentLineInEditor;
        continue;
      }

      this.lineToPropertyBreadcrumbMap.set(this.currentLineInEditor, newPath);
      this.propertyTolineBreadcrumbMap.set(newPath, this.currentLineInEditor);
      // console.log(`${newPath} = line : ${this.currentLineInEditor}`);

      if (val instanceof Object) {
        ++this.currentLineInEditor;
        this.getLineOfEachPropertyValue(newPath, val, profileMapper, val instanceof Array);
      }
      else {
        profileMapper.set(newPath, this.currentLineInEditor);
        // console.log(`4 LINE : ${this.currentLineInEditor} >> ${newPath} = ${val}`);
      }
      ++this.currentLineInEditor;
    }
  }

  propertyType(value: any): string {
    if (value instanceof Array) {
      return 'Array';
    }
    else if (value instanceof Object) {
      return 'object';
    }
    return 'primitive';
  }

  generatePropertyPath(path: string, property: string): string {
    if (path === '') {
      return property;
    }
    return `${path}.${property}`;
  }

  getEditorBreadcrumbArray(): string[] {
    return this.lineToPropertyBreadcrumbMap?.get(this.breadcrumbEditorLine)?.split('.') || [''];
  }

  getBreadcrumbEditorLine(): number {
    return this.breadcrumbEditorLine;
  }

  updateEditorCursorPosition(index: number): void {
    this.mergeEditor.focus();

    const path = this.getEditorBreadcrumbArray().slice(0, index + 1).join('.');
    const cursorPos = this.propertyTolineBreadcrumbMap.get(path);

    // console.log(path);
    try {
      if (cursorPos !== null) {
        // console.log(cursorPos - 1);
        this.mergeEditor.setCursor(cursorPos - 1, 0);
      }

      const startLastIndex = this.getPropertyStartEndIndex(this.mergeEditor.getLine(cursorPos - 1));
      this.mergeEditor.setSelection(
        {line: cursorPos - 1, ch: startLastIndex[0]},
        {line: cursorPos - 1, ch: startLastIndex[1]}
      );
    } catch (exception) {
      console.error(exception);
    }
  }

  getPropertyStartEndIndex(line: string): any {

    const start = line.indexOf('"');
    if (start === -1) {
      return [0, 0];
    }
    for (let last = start + 1; last < line.length; ++last) {
      if (line.charAt(last - 1) !== '\\' && line.charAt(last) === '"') {
        return [start, last + 1];
      }
    }

    return [0, 0];
  }
}
