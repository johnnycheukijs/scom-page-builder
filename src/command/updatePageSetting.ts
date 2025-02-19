import { Control, application } from "@ijstech/components";
import { getMargin, getPageConfig, pageObject } from "../store/index";
import { ICommand } from "./interface";
import { IPageConfig, IPageSectionConfig } from '../interface/index';
import { EVENT } from "../const/index";
import { currentTheme  } from '../theme/index';

const Theme = currentTheme;

export class UpdatePageSettingsCommand implements ICommand {
  private element: any;
  private settings: IPageConfig
  private oldSettings: IPageConfig;
  private rowsConfig: {[key: string]: string} = {};

  constructor(element: Control, settings: IPageConfig) {
    this.element = element;
    this.oldSettings = {...getPageConfig()};
    this.settings = {...getPageConfig(), ...settings};
    const rows = this.element.querySelectorAll('ide-row');
    for (let row of rows) {
      const id = (row?.id || '').replace('row-', '');
      const oldConfig = pageObject.getRowConfig(id) || {};
      this.rowsConfig[id] = JSON.stringify({...this.oldSettings, ...oldConfig});
    }
  }

  private getChangedValues(newValue: IPageSectionConfig, oldValue: IPageSectionConfig) {
    let result = [];
    for (let prop in newValue) {
      if (prop === 'margin') {
        const { x: newX, y: newY } = newValue.margin;
        const { x: oldX, y: oldY } = oldValue.margin;
        if (newX !== oldX || newY !== oldY) result.push(prop);
      } else {
        if (newValue[prop] !== oldValue[prop]) result.push(prop);
      }
    }
    return result;
  }

  private updateConfig(config: IPageConfig, updatedValues: string[]) {
    const { backgroundColor, backgroundImage, customBackground, customTextColor, textColor, customTextSize, textSize, margin, plr, ptb } = config;
    let newConfig: IPageConfig = {};
    for (let prop of updatedValues) {
      newConfig[prop] = config[prop];
    }
    // const element = this.element.closest('i-scom-page-builder') || this.element;

    const defaultTextSize = 'md'
    let data: any = {
      backgroundImage: '',
      plr, ptb,
      customBackground: customBackground,
      backgroundColor: backgroundColor,
      customTextColor: customTextColor,
      textColor: textColor,
      customTextSize: customTextSize,
      textSize: textSize ?? defaultTextSize
    }
    if(updatedValues.includes('backgroundImage')) {
      data.backgroundImage = backgroundImage;
    }
    if (customBackground) {
      if (updatedValues.includes('backgroundColor')) {
        this.element.style.setProperty('--custom-background-color', backgroundColor);
        data.customBackground = customBackground
        data.backgroundColor = backgroundColor;
      }
    } else {
      this.element.style.removeProperty('--custom-background-color');
    }
    if (customTextColor) {
      if (updatedValues.includes('textColor')) {
        this.element.style.setProperty('--custom-text-color', textColor);
        data.customTextColor = customTextColor
        data.textColor = textColor;
      }
      else
        this.element.style.removeProperty('--custom-text-color');
    } else {
      this.element.style.removeProperty('--custom-text-color');
    }
    if (customTextSize) {
      if (updatedValues.includes('textSize') || updatedValues.includes('customTextSize')) {
        this.element.classList.add(`font-${textSize}`);
        data.textSize = textSize;
      }
    }
    else {
      this.element.classList.remove('font-xs', 'font-sm', 'font-md', 'font-lg', 'font-xl');
    }
    if(plr !== undefined) {
      this.element.style.setProperty('--custom-padding-left', `${plr}px`);
      this.element.style.setProperty('--custom-padding-right', `${plr}px`);
    }
    if(ptb !== undefined) {
      this.element.style.setProperty('--custom-padding-top', `${ptb}px`);
      this.element.style.setProperty('--custom-padding-bottom', `${ptb}px`);
    }
    application.EventBus.dispatch(EVENT.ON_UPDATE_PAGE_BG, {...data});
    this.element.maxWidth = '100%'; // maxWidth ?? '100%';
    this.element.margin = getMargin(margin);
    pageObject.config = { ...config };
    return newConfig;
  }

  execute(): void {
    const updatedValues = this.getChangedValues(this.settings, this.oldSettings);
    const newConfig = this.updateConfig(this.settings, updatedValues);
    application.EventBus.dispatch(EVENT.ON_UPDATE_PAGE_CONFIG, {config: newConfig});
  }

  undo(): void {
    const updatedValues = this.getChangedValues(this.oldSettings, this.settings);
    const newConfig = this.updateConfig(this.oldSettings, updatedValues);
    application.EventBus.dispatch(EVENT.ON_UPDATE_PAGE_CONFIG, {config: newConfig, rowsConfig: this.rowsConfig});
  }

  redo(): void {}
}
