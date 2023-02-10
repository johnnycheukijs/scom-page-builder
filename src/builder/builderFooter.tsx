import {
    Module,
    customElements,
    ControlElement,
    Styles,
    Panel,
    observable,
    application,
    Modal,
    Upload
} from '@ijstech/components';
import { EVENT } from '../const/index';
import { IPageElement, IPageFooter } from '../interface/index';
import { PageRow } from '../page/index';
import { generateUUID } from '../utility/index';
import { pageObject } from '../store/index';
import { IDEToolbar } from '../common/index';
import './builderFooter.css';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ['builder-footer']: FooterElement;
        }
    }
}

const Theme = Styles.Theme.ThemeVars;

export interface FooterElement extends ControlElement {
    readonly?: boolean;
}

@customElements('builder-footer')
export class BuilderFooter extends Module {
    private pnlFooter: Panel;
    private pnlFooterMain: Panel;
    private pnlEditOverlay: Panel;
    private pnlOverlay: Panel;
    private pnlConfig: Panel;
    private mdUpload: Modal;
    private uploader: Upload;

    private _image: string;
	private _elements: IPageElement[];
    private _readonly: boolean = false;

    @observable()
    private showAddStack: boolean = true;

    constructor(parent?: any) {
        super(parent);
        this.initEventBus();
    }

    initEventBus() {
        application.EventBus.register(this, EVENT.ON_UPDATE_SECTIONS, async () => {
            if (!this.pnlFooterMain.hasChildNodes())
                this.resetData();
        })
    }

    private resetData() {
        this.showAddStack = true;
        this.pnlFooter.background = {color: '#fff', image: ''};
        this.pnlEditOverlay.visible = false;
        this.pnlOverlay.visible = false;
        this.pnlConfig.visible = false;
    }

    get data(): IPageFooter {
        return {
            image: this._image,
            elements: this._elements
        };
    }
    set data(value: IPageFooter) {
        this.setData(value);
        this.updateFooter();
    }

    setData(value: IPageFooter) {
        this._image = value.image;
        this._elements = value.elements;
        pageObject.footer = value;
    }

    private async updateFooter() {
        this.showAddStack = this._elements.length === 0;
        if (!this.showAddStack) {
            this.pnlEditOverlay.visible = true;
            this.pnlConfig.visible = true;
        }
        if (this.pnlEditOverlay.visible)
            this.pnlEditOverlay.classList.add('flex');
        else
            this.pnlEditOverlay.classList.remove('flex');
        this.pnlFooter.background = {image: this._image};
        this.pnlFooterMain.clearInnerHTML();
        const pageRow = (<ide-row maxWidth="100%" maxHeight="100%"></ide-row>) as PageRow;
        const rowData = {
            id: 'footer', // generateUUID(),
            row: -1,
            elements: this._elements
        }
        await pageRow.setData(rowData);
        pageRow.parent = this.pnlFooterMain;
        this.pnlFooterMain.append(pageRow);
        application.EventBus.dispatch(EVENT.ON_UPDATE_FOOTER);
    }

    private addFooter() {
        this.data = {
            image: '',
            elements: [{
                id: generateUUID(),
                column: 1,
                columnSpan: 4,
                type: 'primitive',
                module: {
                    description: 'Textbox (dev)',
                    localPath: 'modules/pageblocks/pageblock-markdown-editor',
                    name: "Textbox",
                    local: true
                },
                properties: {
                    width: '100%',
                    height: '130px'
                }
            }]
        }
    }

    private updateOverlay(value: boolean) {
        this.pnlEditOverlay.visible = value;
        if (this.pnlEditOverlay.visible)
            this.pnlEditOverlay.classList.add('flex');
        else
            this.pnlEditOverlay.classList.remove('flex');
        this.pnlOverlay.visible = !this.pnlEditOverlay.visible;
        this.pnlOverlay.height = this.pnlOverlay.visible ? document.body.offsetHeight : 0;
        if (!this.pnlOverlay.visible) {
            const row = this.querySelector('ide-row');
            if (row) {
                row.classList.remove('active');
                const toolbars = row.querySelectorAll('ide-toolbar');
                toolbars.forEach((toolbar) => {
                    (toolbar as IDEToolbar).hideToolbars();
                })
            }
        }
    }

    onChangedBg() {
        this.uploader.clear();
        this.mdUpload.visible = true;
    }

    private async onUpdateImage() {
        const fileList = this.uploader.fileList || [];
        const file = fileList[0];
        const image = file ? await this.uploader.toBase64(file) as string : '';
        this.pnlFooterMain.background = {image};
        this._image = image;
        this.mdUpload.visible = false;
    }

    init() {
        this._readonly = this.getAttribute('readonly', true, false);
        super.init();
        this.position = 'absolute',
        this.width = '100%';
        this.display = 'block';
        this.bottom = '0px';
        this.minHeight = 180;
    }

    render() {
        return (
            <i-vstack
                id="pnlFooter"
                width="100%" height="100%"
                maxWidth="100%" maxHeight="100%"
            >
                <i-panel
                    id="pnlOverlay"
                    width="100%" height="100%"
                    background={{color: 'rgba(0,0,0,.6)'}}
                    zIndex={29}
                    visible={false}
                    onClick={() => this.updateOverlay(true)}
                ></i-panel>
                <i-hstack
                    id="pnlEditOverlay"
                    width="100%" height="100%"
                    position="absolute" top="0px" left="0px"
                    background={{color: 'rgba(0,0,0,.6)'}}
                    zIndex={29}
                    visible={false}
                    verticalAlignment="center" horizontalAlignment="center"
                    class="edit-stack"
                >
                     <i-button
                        class="btn-add"
                        icon={{ name: 'plus-circle', fill: 'rgba(0,0,0,.54)' }}
                        font={{ color: 'rgba(0,0,0,.54)' }}
                        background={{ color: Theme.colors.secondary.light }}
                        padding={{ top: 10, left: 6, right: 6, bottom: 10 }}
                        border={{ radius: 2 }}
                        caption="Edit Footer"
                        onClick={() => this.updateOverlay(false)}
                    ></i-button>
                </i-hstack>
                <i-hstack
                    verticalAlignment="end"
                    horizontalAlignment="center"
                    width="100%" height="auto"
                    display='inline-block'
                    position="absolute" bottom="0px"
                    margin={{bottom: -10}}
                    class="edit-stack"
                    visible={this.showAddStack}
                >
                    <i-panel>
                        <i-button
                            id="btnAddFooter"
                            class="btn-add"
                            icon={{ name: 'plus-circle', fill: 'rgba(0,0,0,.54)' }}
                            font={{ color: 'rgba(0,0,0,.54)' }}
                            background={{ color: Theme.colors.secondary.light }}
                            padding={{ top: 10, left: 6, right: 6, bottom: 10 }}
                            border={{ radius: 2 }}
                            caption="Add Footer"
                            onClick={() => this.addFooter()}
                        ></i-button>
                    </i-panel>
                </i-hstack>
                <i-panel id="pnlFooterMain" max-maxWidth="100%" maxHeight="100%"></i-panel>
                <i-hstack
                    id="pnlConfig"
                    background={{ color: '#fafafa' }}
                    bottom="0px" left="0px" position="absolute"
                    verticalAlignment="center"
                    border={{ radius: 2 }}
                    margin={{left: 12, top: 12, bottom: 12, right: 12}}
                    height="40px"
                    class="custom-box"
                    visible={false}
                >
                    <i-button
                        class="btn-add"
                        icon={{ name: 'image', fill: 'rgba(0,0,0,.54)' }}
                        font={{ color: 'rgba(0,0,0,.54)' }}
                        background={{ color: 'transparent' }}
                        padding={{ left: 6, right: 6 }} height="100%"
                        border={{ width: 0 }}
                        caption="Change Image"
                        onClick={() => this.onChangedBg()}
                    ></i-button>
                </i-hstack>
                <i-modal
                    id='mdUpload'
                    title='Select Image'
                    closeIcon={{ name: 'times' }}
                    width={400}
                    closeOnBackdropClick={false}
                >
                    <i-vstack padding={{top: '1rem'}} gap="1rem">
                        <i-upload
                            id='uploader'
                            draggable
                            caption='Drag and Drop image'
                            class="custom-uploader"
                        ></i-upload>
                        <i-hstack horizontalAlignment="end">
                            <i-button
                                id="btnAddImage"
                                icon={{ name: 'plus-circle', fill: 'rgba(0,0,0,.54)' }}
                                font={{color: 'rgba(0,0,0,.54)'}}
                                background={{color: Theme.colors.secondary.light}}
                                padding={{top: 10, left: 6, right: 6, bottom: 10}}
                                border={{radius: 2}}
                                caption="Add Image"
                                onClick={this.onUpdateImage.bind(this)}
                            ></i-button>
                        </i-hstack>
                    </i-vstack>
                </i-modal>
            </i-vstack>
        )
    }
}
