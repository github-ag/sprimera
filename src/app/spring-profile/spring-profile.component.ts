import { ProfileDataTO } from './../shared/models/ProfileDataTO';
import { ProfileSpecTO } from './../shared/models/ProfileSpecTO';
import { ProfileAggregatorService } from './../shared/profile-aggregator/profile-aggregator.service';
import { ThrowStmt } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import * as CodeMirror from 'codemirror';
import * as yaml from 'js-yaml';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-spring-profile',
  templateUrl: './spring-profile.component.html',
  styleUrls: ['./spring-profile.component.scss']
})
export class SpringProfileComponent implements OnInit {

  SPACES_TO_ONE_TAB = 2;

  CODEMIRROR_CONFIG: any = {
    theme: 'monokai',
    mode: 'application/ld+json',
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

  private SPACE_REPLACE = '';
  private aggregatedContent = '';

  constructor(private profileAggregateService: ProfileAggregatorService) {
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

        const reader = new FileReader();
        reader.onload = (e: any) => {
          const content = e?.target?.result || '';

          this.profileToContentMapper.set(file.name,
            this.replaceAll(content, '\t', this.SPACE_REPLACE)
          );
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

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e?.target?.result || '';
        codemirror.setValue(content);
        codemirror.refresh();
      };
      reader.readAsText(file);
      this.profileYAMLLoaded.add(file.name);

      const divElement = document.getElementById('profile-expand-' + index);
      if (divElement) {
        codemirror.on('change', (event) => {

          const content = this.replaceAll(event.getValue(), '\t', this.SPACE_REPLACE);
          this.profileToContentMapper.set(file.name, content);

          if (this.validateYAML(file, content)) {
            this.toggleValidInValid(divElement, 'border-danger', 'border-success');
          }
          else {
            this.toggleValidInValid(divElement, 'border-success', 'border-danger');
          }
        });
      }
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
        this.profileToContentMapper.get(profileDataTO.file.name))
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

        this.aggregatedContent = response.content;
        setTimeout(() => {
          codemirror.setValue(response.content);
          codemirror.setSize('100%', 350);
          codemirror.refresh();
        }, 250);
      },
      (error) => {
        console.error(error);
      }
    );
  }
}
