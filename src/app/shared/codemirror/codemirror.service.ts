import { Injectable } from '@angular/core';
import {ProfileDataTO} from '../models/ProfileDataTO';
import * as CodeMirror from 'codemirror';
import {SpringProfileComponent} from '../../spring-profile/spring-profile.component';

@Injectable({
  providedIn: 'root'
})
export class CodemirrorService {

  private lineToPropertyBreadcrumbMap: any;
  private propertyTolineBreadcrumbMap: any;
  private _breadcrumbEditorLine = -1;
  private currentLineInEditor = 0;
  private _mergeEditor: any;

  private _content = '';

  constructor() { }

  mergeEditorConstruct(codemirrorTextArea: any, configuration: any, data: any): void {

    configuration.foldGutter = false;
    configuration.readOnly = true;

    this._mergeEditor = CodeMirror.fromTextArea(codemirrorTextArea, configuration);

    this._mergeEditor.on('dblclick', (instance: any, event: Event) => {
      this.breadcrumbEditorLine = instance.getCursor().line + 1;
      SpringProfileComponent.DisplayPropertyPathOrFind = true;
    });

    this._content = JSON.stringify(data, null, 2);
  }
  showEditor(): void {
    this._mergeEditor.setValue(this._content);
    this._mergeEditor.setSize('100%', '100%');
    this._mergeEditor.refresh();
  }

  set content(data: string) {
    this._content = data;
  }
  get content(): string {
    return this._content;
  }

  set breadcrumbEditorLine(line: number) {
    this._breadcrumbEditorLine = line;
  }

  updateCodeMirrorVisual(profileData: ProfileDataTO[], COLOR_ARRAY: string[], propertyList: any, jsonObject: any): void {

    const parent = document.getElementById('display-aggregate');
    const lineElements = parent?.getElementsByClassName('CodeMirror-linenumber CodeMirror-gutter-elt');
    if (lineElements) {

      const profileMapper = new Map();
      this.currentLineInEditor = 2;

      this.lineToPropertyBreadcrumbMap = new Map();
      this.propertyTolineBreadcrumbMap = new Map();
      this._breadcrumbEditorLine = -1;

      this.getLineOfEachPropertyValue('', jsonObject, profileMapper, false);

      const profileColorMap = new Map(profileData.map((prof, index) => [prof.file.name, COLOR_ARRAY[index]]));

      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < propertyList.length; ++i) {
        const prop = propertyList[i];
        const lineNumber = profileMapper.get(prop.property);
        this.updateColor(lineElements[lineNumber], profileColorMap.get(prop.owner));
      }

      profileData.forEach((profile, index) => {
        this.updateColor(document.getElementById(`side-bar-${index}`), COLOR_ARRAY[index]);
      });
    }
  }

  updateColor(element: any, color: any): void {
    if (element) {
      element.style['background-color'] = color;
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

  getLineOfEachPropertyValue(path: string, root: any,  profileMapper: any, isArray: boolean): void {
    const parentIndex = this.currentLineInEditor;
    for (const pro of Object.keys(root)) {
      const val = root[pro];
      const newPath = this.generatePropertyPath(path, pro);

      if (this.propertyType(val) === 'primitive' && isArray) {
        profileMapper.set(path, parentIndex - 1);
        this.lineToPropertyBreadcrumbMap.set(this.currentLineInEditor, `${newPath}.${val}`);
        this.propertyTolineBreadcrumbMap.set(`${newPath}.${val}`, this.currentLineInEditor);
        ++this.currentLineInEditor;
        continue;
      }

      this.lineToPropertyBreadcrumbMap.set(this.currentLineInEditor, newPath);
      this.propertyTolineBreadcrumbMap.set(newPath, this.currentLineInEditor);

      if (val instanceof Object) {
        ++this.currentLineInEditor;
        this.getLineOfEachPropertyValue(newPath, val, profileMapper, val instanceof Array);
      }
      else {
        profileMapper.set(newPath, this.currentLineInEditor);
      }
      ++this.currentLineInEditor;
    }
  }

  generatePropertyPath(path: string, property: string): string {
    if (path === '') {
      return property;
    }
    return `${path}.${property}`;
  }

  getEditorBreadcrumbArray(): string[] {
    return this.lineToPropertyBreadcrumbMap?.get(this._breadcrumbEditorLine)?.split('.') || [''];
  }

  updateEditorCursorPosition(index: number): void {
    this._mergeEditor.focus();

    if (index === this.getEditorBreadcrumbArray().length) {
      return;
    }
    try {
      this.highlightPropertyInCursorLine(this.propertyTolineBreadcrumbMap
        .get(this.getEditorBreadcrumbArray().slice(0, index + 1).join('.')));
    }
    catch (exception) { // can case when primitive index
      console.error(exception);
      this.updateEditorCursorPosition(index + 1);
    }
  }

  private highlightPropertyInCursorLine(cursorPos: number): void {
    if (cursorPos !== null) {
      this._mergeEditor.setCursor(cursorPos - 1, 0);
    }

    const startLastIndex = this.getPropertyStartEndIndex(this._mergeEditor.getLine(cursorPos - 1));
    this._mergeEditor.setSelection(
      {line: cursorPos - 1, ch: startLastIndex[0]},
      {line: cursorPos - 1, ch: startLastIndex[1]}
    );
  }

  highlightPropertyInPropertyPath(path: string): void {
    try {
      this.highlightPropertyInCursorLine(this.propertyTolineBreadcrumbMap.get(path));
    }
    catch (e) {}
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

  findSuggestedPropertyList(text: string): string[] {
    console.log('search : ', text.substr(text.lastIndexOf('.') + 1));
    const suggestedPropertyList: string[] = [];
    this.propertyTolineBreadcrumbMap.forEach((value: number, key: string) => {
      if (key.startsWith(text) && key.length !== text.length) {
        suggestedPropertyList.push(key);
      }
    });
    return suggestedPropertyList;
  }
}
