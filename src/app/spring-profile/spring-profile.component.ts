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
import {YamlService} from '../shared/yaml/yaml.service';
import {CodemirrorService} from '../shared/codemirror/codemirror.service';
import {ColorProviderService} from '../shared/color-provider/color-provider.service';
import {MatDrawer} from '@angular/material/sidenav';
import {alertAnimation} from '../shared/animation/animation';

@Component({
  selector: 'app-spring-profile',
  templateUrl: './spring-profile.component.html',
  styleUrls: ['./spring-profile.component.scss'],
  animations: [alertAnimation]
})
export class SpringProfileComponent implements OnInit {

  constructor(private renderer: Renderer2, private profileAggregateService: ProfileAggregatorService,
              private yamlFileService: YamlService,
              private codemirrorService: CodemirrorService,
              private colorProviderService: ColorProviderService) {
    this.SPACE_REPLACE = ' '.repeat(this.SPACES_TO_ONE_TAB);
  }

  static DisplayPropertyPathOrFind = true;

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

  private profileToContentMapper = new Map();
  private profilesSet = new Set();
  private profiles: ProfileDataTO[] = [];
  private profileIndex = -1;

  SUGGESTED_LIST: string[] = [];

  private SPACE_REPLACE = '';

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

  toggleEnableDrag = () => this.IS_DRAGGABLE = !this.IS_DRAGGABLE;
  getProfileIndex = () => this.profileIndex;
  getAggregatedContent = () => this.codemirrorService.content;
  getProfiles = () => this.profiles;
  getEditorBreadcrumbArray = () => this.codemirrorService.getEditorBreadcrumbArray();
  getProfileErrorMessage = (file: File) => this.yamlFileService.getProfileErrorMessage(file);
  updateEditorCursorPosition = (index: number) => this.codemirrorService.updateEditorCursorPosition(index);

  get displayPropertyPathOrFind(): boolean {
    return SpringProfileComponent.DisplayPropertyPathOrFind;
  }
  toggleDisplayPropertyPathOrFind(): void {
    SpringProfileComponent.DisplayPropertyPathOrFind = !SpringProfileComponent.DisplayPropertyPathOrFind;
  }

  uploadFiles(event: any): void {

    for (const file of event.target.files) {
      if (!this.profilesSet.has(file.name)) {
        this.profilesSet.add(file.name);
        this.profiles.push(new ProfileDataTO(file, this.colorProviderService.getColor()));
        this.codemirrorService.content = '';

        const index = this.profiles.length - 1;

        const reader = new FileReader();
        reader.onload = (e: any) => {
          const content = e?.target?.result || '';

          this.profileToContentMapper.set(file.name,
            this.yamlFileService.replaceAll(content, '\t', this.SPACE_REPLACE)
          );

          const divStatus = document.getElementById('profile-expand-status-' + index);
          this.yamlFileService.updateCssValidate(divStatus, file, content);
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

  removeFile(index: number, file: File, sideNav: MatDrawer): void {

    this.colorProviderService.addColor(this.profiles[index].color);
    this.profiles = this.profiles.filter((_, i) => i !== index);

    this.profileToContentMapper.delete(file.name);
    this.yamlFileService.deleteYaml(file.name);
    this.profilesSet.delete(file.name);

    if (this.profileIndex === index) {
      this.ngOnInit();
    }
    else if (this.profileIndex > index) {
      this.profileIndex -= 1;
    }

    if (this.getProfiles().length === 0) {
      this.codemirrorService.content = '';
      sideNav?.close();
    }
  }

  clearFiles(): void {
    this.profileToContentMapper.clear();
    this.yamlFileService.clearYamls();
    this.profilesSet.clear();
    this.profiles = [];

    this.ngOnInit();
    this.codemirrorService.content = '';
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

    if (!this.yamlFileService.getYaml(file.name)) {

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

        this.yamlFileService.updateCssValidate(divStatus, file, content);
      };
      reader.readAsText(file);
      this.yamlFileService.addYaml(file.name);

      codemirror.on('change', (event) => {

        const content = this.yamlFileService.replaceAll(event.getValue(), '\t', this.SPACE_REPLACE);
        this.profileToContentMapper.set(file.name, content);
        this.yamlFileService.updateCssValidate(divStatus, file, content);
      });
    }
  }

  aggregateProfiles(): void {

    if (this.getProfiles().length === 0) {
      return;
    }
    this.collapseProfileExceptIndex(-1);

    const profileAggregateList: ProfileSpecTO[] = [];

    this.profiles.forEach((profileDataTO: ProfileDataTO, index: number) => {
      profileAggregateList.push(
        new ProfileSpecTO(profileDataTO.file.name,
        this.profileToContentMapper.get(profileDataTO.file.name), profileDataTO.color.color)
      );
    });

    this.codemirrorService.content = '';
    this.profileAggregateService.aggregateProfile(profileAggregateList).subscribe(
      (response: ProfileSpecTO) => {
        const parent = document.getElementById('display-aggregate');
        if (parent) {
          parent.innerHTML = '<textarea id="aggregate-textarea-content"></textarea>';
        }

        const jsonObject  = response.jsonContent;
        this.codemirrorService.mergeEditorConstruct(
          document.getElementById('aggregate-textarea-content') as HTMLTextAreaElement,
          JSON.parse(JSON.stringify(this.CODEMIRROR_CONFIG)),
          jsonObject
        );
        setTimeout(() => {
          this.codemirrorService.showEditor();
          setTimeout(() => {
            this.codemirrorService.updateCodeMirrorVisual(this.getProfiles(), response.propertyList, jsonObject);
            this.SUGGESTED_LIST = this.codemirrorService.findSuggestedPropertyList('');
          }, 200);
        }, 500);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  highSuggestedText(text: string): void {
    this.codemirrorService.highlightPropertyInPropertyPath(text);
  }
}
