import {
    ControlElement,
    customElements,
    Module,
    VStack,
    Styles,
    application,
    Control,
    Input,
    Label,
    Icon
} from '@ijstech/components';
import { pageObject } from '../store/index';
import { EVENT } from '../const/index';
import { IPageSection, IPageElement, IMenuItem } from '../interface/index';
import { menuBtnStyle, menuCardStyle, menuStyle } from './pageMenu.css';
import { commandHistory, MoveElementCommand } from '../command/index';

const Theme = Styles.Theme.ThemeVars;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ['i-scom-page-builder-menu']: ControlElement;
        }
    }
}

@customElements('i-scom-page-builder-menu')
export class PageMenu extends Module {

    private pnlMenu: VStack;
    private pnlMenuWrapper: VStack;
    private menuWrapper: VStack;
    private items: IMenuItem[];
    private draggingSectionId: string;
    private isEditing: boolean = false;

    init() {
        super.init();
        this.initEventBus();
        this.initEventListener();
    }

    private initEventBus() {
        application.EventBus.register(this, EVENT.ON_UPDATE_MENU, async (sections: IPageSection[]) => this.renderMenu(sections));
        application.EventBus.register(this, EVENT.ON_SELECT_SECTION, async (rowId: string) => this.setfocusCard(rowId));
    }

    initEventListener() {
        this.addEventListener('dragstart', (event) => {
            const eventTarget = event.target as HTMLElement;
            if (!eventTarget || this.isEditing) {
                event.preventDefault();
                return;
            }
            this.draggingSectionId = eventTarget.getAttribute('rowId');
        });

        this.addEventListener('dragend', (event) => {
            // remove all active drop line
            if (!this.draggingSectionId) {
                event.preventDefault();
                return;
            }
            const activeLineIdx = this.getActiveDropLineIdx();
            if (activeLineIdx != -1)
                this.reorderSection(this.draggingSectionId, activeLineIdx);

            this.setActiveDropLine(-1);
            this.draggingSectionId = undefined;
        });

        this.addEventListener('dragover', (event) => {
            if (!this.draggingSectionId) {
                event.preventDefault();
                return;
            }
            this.showDropBox(event.clientX, event.clientY);
        });

        this.addEventListener('drop', (event) => {
            if (!this.draggingSectionId) {
                event.preventDefault();
                return;
            }
        });
    }

    initMenuCardEventListener(card: Control) {
        card.addEventListener('mouseenter', (event) => {
            if (this.isEditing) return;
            this.toggleRenameBtn(card.getAttribute('rowId'), true);
        });
        card.addEventListener('mouseleave', (event) => {
            if (this.isEditing) return;
            this.toggleRenameBtn(card.getAttribute('rowId'), false);
        });
    }

    private setfocusCard(rowId: string) {
        const menuCards = this.pnlMenu.querySelectorAll('#menuCard');
        for (let i = 0; i < menuCards.length; i++) {
            const cardDot = menuCards[i].querySelector('#cardDot');
            const cardTitle = menuCards[i].querySelector('#cardTitle');
            cardDot.classList.remove("focused-card");
            cardTitle.classList.remove("focused-card");
            if (menuCards[i].getAttribute('rowId') == rowId) {
                cardDot.classList.add("focused-card");
                cardTitle.classList.add("focused-card");
            }
        }
    }

    private getActiveDropLineIdx(): number {
        const dropLines = document.querySelectorAll('[id^="menuDropLine"]');
        for (let i = 0; i < dropLines.length; i++) {
            if (dropLines[i].classList.contains('active-drop-line')) {
                return (i >= dropLines.length - 1) ? i - 1 : i;
            }
        }
        return -1;
    }

    private showDropBox(clientX: number, clientY: number) {
        const menuRect = this.pnlMenu.getBoundingClientRect();
        if (clientX < menuRect.left || clientX > menuRect.right) return;
        const menuCards = this.pnlMenu.querySelectorAll('#menuCard');
        for (let i = 0; i < menuCards.length; i++) {
            const menuCardRect = menuCards[i].getBoundingClientRect();
            if (clientY >= menuCardRect.top && clientY <= menuCardRect.bottom) {
                const middleLine = menuCardRect.top + menuCardRect.height / 2;
                // decide show top/bottom box
                this.setActiveDropLine((clientY < middleLine) ? i : i + 1);
                return;
            }
        }
    }

    private reorderSection(currentRowId: string, newPosition: number) {
        const menuCards = this.pnlMenu.querySelectorAll('#menuCard');
        const enteredRowId = menuCards[newPosition].getAttribute('rowId');

        const currentRow = document.getElementById(`row-${currentRowId}`);
        const enteredRow = document.getElementById(`row-${enteredRowId}`);
        const pnlRows = document.getElementById('pnlRows');
        const moveRowCmd = new MoveElementCommand(
            currentRow,
            enteredRow,
            pnlRows,
            pageObject.sections
        );
        moveRowCmd && commandHistory.execute(moveRowCmd);
    }

    private setActiveDropLine(idx: number) {
        const dropLines = document.querySelectorAll('[id^="menuDropLine"]');
        for (const dropLine of dropLines) {
            dropLine.classList.remove('active-drop-line');
            dropLine.classList.remove('inactive-drop-line');
            if (dropLine.id == `menuDropLine-${idx}`) {
                dropLine.classList.add('active-drop-line');
            } else {
                dropLine.classList.add('inactive-drop-line');
            }
        }
    }

    renderMenu(sections: IPageSection[]) {
        this.pnlMenu.clearInnerHTML();
        this.items = sections.map((section: IPageSection) => {
            return {
                caption: this.getTitle(section),
                rowId: section.id.replace("row-", "")
            };
        })

        // set the titles here
        const dropLine = (<i-panel id={`menuDropLine-0`} width={'100%'} height={'5px'}></i-panel>);
        this.pnlMenu.appendChild(dropLine);
        for (let i = 0; i < this.items.length; i++) {
            const menuCard = (
                <i-hstack
                    id="menuCard"
                    class={menuCardStyle}
                    verticalAlignment="center"
                    horizontalAlignment='space-between'
                    width="100%"
                    border={{ radius: 5 }}
                    overflow="hidden"
                    onClick={() => this.goToSection(this.items[i].rowId)}
                >
                    <i-hstack verticalAlignment="center" horizontalAlignment='start'>
                        <i-label
                            id="cardDot"
                            caption={"•"}
                            font={{ size: '16px', color: '#3b3838', weight: 530 }}
                            padding={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            maxHeight={34}
                            overflow={"hidden"}
                        ></i-label>
                        <i-label
                            id="cardTitle"
                            caption={this.items[i].caption}
                            font={{ size: '16px', color: '#3b3838', weight: 530 }}
                            padding={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            maxHeight={34}
                            overflow={"hidden"}
                        ></i-label>
                        <i-input
                            id="cardInput"
                            visible={false}
                            width='90%'
                            height='40px'
                            padding={{ left: '0.5rem', top: '0.5rem', bottom: '0.5rem', right: '0.5rem' }}
                            onChanged={(control) => this.setCardTitle(control, this.items[i].rowId)}
                        ></i-input>
                    </i-hstack>
                    <i-icon
                        id="cardRenameBtn"
                        name='ellipsis-h'
                        width={22} height={22}
                        padding={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        margin={{ right: 4 }}
                        class="pointer iconButton"
                        visible={false}
                        tooltip={{ content: "Rename", placement: "right" }}
                        onClick={() => this.onClickRenameBtn(this.items[i].rowId)}
                    ></i-icon>
                    <i-icon
                        id="cardConfirmBtn"
                        name="check"
                        width={22} height={22}
                        padding={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        margin={{ right: 4 }}
                        class="pointer iconButton"
                        visible={false}
                        tooltip={{ content: "Confirm", placement: "right" }}
                        onClick={() => this.onClickConfirmBtn(this.items[i].rowId)}
                    ></i-icon>
                </i-hstack>
            );
            menuCard.setAttribute('draggable', 'true');
            menuCard.setAttribute('rowId', this.items[i].rowId);
            this.pnlMenu.appendChild(menuCard);
            this.initMenuCardEventListener(menuCard);

            const dropLine = (<i-panel id={`menuDropLine-${i + 1}`} width={'100%'} height={'5px'}></i-panel>);
            this.pnlMenu.appendChild(dropLine);
        }
    }

    private setCardTitle(control: Control, rowId: string) {
        const caption = (control as Input).value;

        // change data
        const sectionIdx = pageObject.sections.findIndex(section => section.id == rowId);
        pageObject.sections[sectionIdx].name = caption;

        // change UI on-the-fly
        const currCard = this.pnlMenu.querySelector(`[rowId="${rowId}"]`) as HTMLElement;
        const cardTitle = currCard.querySelector('#cardTitle');
        (cardTitle as Label).caption = caption;
    }

    private onClickRenameBtn(rowId: string) {
        this.toggleEditor(rowId, true);
    }

    private onClickConfirmBtn(rowId: string) {
        this.toggleEditor(rowId, false);
    }

    private toggleRenameBtn(rowId: string, toggle: boolean) {
        const currCard = this.pnlMenu.querySelector(`[rowId="${rowId}"]`) as HTMLElement;
        const cardRenameBtn = currCard.querySelector('#cardRenameBtn');
        (cardRenameBtn as Icon).visible = toggle;
    }

    private toggleEditor(rowId: string, toggle: boolean) {
        this.isEditing = toggle;

        const currCard = this.pnlMenu.querySelector(`[rowId="${rowId}"]`) as HTMLElement;
        const cardTitle = currCard.querySelector('#cardTitle');
        const cardInput = currCard.querySelector('#cardInput');
        const cardRenameBtn = currCard.querySelector('#cardRenameBtn');
        const cardConfirmBtn = currCard.querySelector('#cardConfirmBtn');

        (cardInput as Input).value = (cardTitle as Label).caption;
        (cardTitle as Label).visible = !toggle;
        (cardInput as Input).visible = toggle;
        (cardRenameBtn as Icon).visible = !toggle;
        (cardConfirmBtn as Icon).visible = toggle;
    }

    private goToSection(rowId: string) {
        document.getElementById(`row-${rowId}`).scrollIntoView();
        application.EventBus.dispatch(EVENT.ON_SHOW_SECTION, rowId);
    }

    private getTitle(data: IPageSection): string {
        return data.name ? data.name : (data.elements.length > 1) ? "Untitled section" : this.getTitleFn(data.elements[0]);
    }

    private getTitleFn(data: IPageElement): string {
        if (data && data.elements) {
            return this.getTitleFn(data.elements[0]);
        } else if (data && data.module) {
            // TODO: get the precise title here
            return "Untitled " + data.module.name.toLowerCase();
        } else {
            return "Untitled section";
        }
    }

    private toggleMenu() {
        this.pnlMenuWrapper.visible = !this.pnlMenuWrapper.visible;
    }

    render() {
        return (
            <i-hstack position='fixed' top="60px" left="30px" height={0} width={0} verticalAlignment="center" horizontalAlignment='center'>
                <i-vstack id="menuWrapper" position='absolute' top="0px" left="0px" gap={"0.5rem"}
                    padding={{ top: '1rem', right: '1rem', bottom: '1rem', left: '1rem' }}
                    class={menuBtnStyle}>
                    <i-hstack gap={'1rem'} verticalAlignment='center' onClick={this.toggleMenu} class="pointer">
                        <i-icon width={22} height={22} name={"bars"} fill={Theme.colors.primary.main}></i-icon>
                        <i-label caption={"Menu"} font={{ color: '#3b3838', weight: 750, size: '18px' }} class="prevent-select"></i-label>
                    </i-hstack>
                    <i-vstack id="pnlMenuWrapper" width={320} visible={false}>
                        <i-vstack id='pnlMenu' class={menuStyle}></i-vstack>
                    </i-vstack>
                </i-vstack>
            </i-hstack>
        )
    }
}