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
    matchBrackets: true
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
      codemirror.setSize('100%', 300);

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
        const codemirror = CodeMirror.fromTextArea(document.getElementById('aggregate-textarea-content') as HTMLTextAreaElement,
        modifyConfig
        );

        const jsonObject  = response.jsonContent;
        const jsonContent = JSON.stringify(jsonObject, null, this.SPACES_TO_ONE_TAB);
        this.aggregatedContent = jsonContent;

        setTimeout(() => {

          codemirror.setValue(this.aggregatedContent);
          codemirror.setSize('100%', '100%');
          codemirror.refresh();

          setTimeout(() => this.updateCodeMirrorVisual(codemirror, response.propertyList, jsonObject), 500);
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

      // console.log(jsonObject);
      this.getLineOfEachPropertyValue('', jsonObject, profileMapper, false);

      const profileColorMap = new Map(this.getProfiles().map(i => [i.file.name, i.color]));

      // console.log(propertyList);
      // console.log(profileMapper);
      for (let i = 0; i < propertyList.length; ++i) {
        const prop = propertyList[i];
        const lineNumber = profileMapper.get(prop.property);
        this.updateColor(lineElements[lineNumber], profileColorMap.get(prop.owner));
      }
    }
  }

  updateColor(element: any, color: any): void {
    element.style['background-color'] = color;
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
        ++this.currentLineInEditor;
        continue;
      }
      if (val instanceof Object) {
        // console.log(3, val, val instanceof Array, `line : ${this.currentLineInEditor}`);
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
}
