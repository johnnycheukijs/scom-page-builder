import { IPageHeader, IPageSection, IPageFooter, IPageElement } from "../interface/index";

export class PageObject {
  private _header: IPageHeader = null;
  private _sections: Map<string, IPageSection> = new Map();
  private _footer: IPageFooter = null;

  set header(value: IPageHeader) {
    this._header = value;
  }
  get header() {
    return this._header;
  }

  set sections(value: IPageSection[]) {
    value.forEach(val => {
      this._sections.set(val.id, val)
    })
  }
  get sections(): IPageSection[] {
    return Array.from(this._sections.values());
  }

  set footer(value: IPageFooter) {
    this._footer = value;
  }
  get footer() {
    return this._footer;
  }

  addSection(value: IPageSection) {
    this._sections.set(value.id, value);
  }

  removeSection(id: string) {
    this._sections.delete(id);
  }

  getSection(id: string) {
    return this._sections.get(id) || null;
  }

  private findElement(elements: IPageElement[], elementId: string) {
    if (!elements || !elements.length) return null;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.id === elementId) {
        return element;
      } else if (element.type === 'composite') {
        const elm = this.findElement(element.elements, elementId);
        if (elm) return elm;
      }
    }
    return null;
  }

  getElement(sectionId: string, elementId: string) {
    const section = this.getSection(sectionId);
    console.log('section', section)
    if (!section) return null;
    const elm = this.findElement(section.elements, elementId);
    return elm
  }

  setElement(sectionId: string, elementId: string, value: any) {
    let elm = this.getElement(sectionId, elementId);
    console.log(elm)
    if (elm) elm.properties = value;
    console.log(this.sections)
  }
}

export const pageObject = new PageObject();
