// Freecell4Maemo, Copyright 2008, Roy Wood
//                 Copyright 2010, Justin Quek
// Kivy port,      Copyright 2016, Lukas Beck
// Web port        Copyright 2025, Miff
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option)
// any later version.
//
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
// or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program. If not, see <https://www.gnu.org/licenses/>. 
//

// Size of the inset border for the window
const FullscreenBorderWidth = 10;
const SmallscreenBorderWidth = 2;

// Border between upper/lower sets of cards
const VertSeparatorWidth = 10;

// Suit IDs
enum Suit {
    Clubs = 0,
    Diamonds = 1,
    Spades = 2,
    Hearts = 3,
    Undefined = -1
}

const SuitNames = ["Clubs", "Diamonds", "Spades", "Hearts"];
const CardNmaes = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Knight", "Queen", "King"];
const SuitSym = ["C", "D", "S", "H"];
const CardSym = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];

// Suit colors
enum SuitColor {
    Black = 0,
    Red = 1,
    Undefined = -1
}

// Number of cards per suit
const CardsPerSuit = 13;

// Card images 0-51 are the regular cards.
const NumCards = 52;

// Cards 52 - 55 are the suit-back cards (aces in top-right of screen)
// Card 56 is the blank-back card (used to draw stacks with no cards)
// Card 57 is the fancy-back card (not used)
const CardBacks = {
    Clubs: 52,
    Diamonds: 53,
    Spades: 54,
    Hearts: 55,
    Blank: 56,
    Fancy: 57
};

// Total number of card images
const TotalNumCards = CardBacks.Fancy + 1;

// Total number of card columns
const NumColumns = 8;

// Number of "free cells"
const NumFreeCells = 4;

// Number of ace cards
const NumAces = 4;

// Types of cards
enum StackType {
    Freecell = 0,
    Ace = 1,
    Regular = 2,
    Undefined = -1
}

const StackTypeName = ["FreeCell", "AceStack", "PlayStack"];

const CardGraphicsWidth = 73;
const CardGraphicsHeight = 97;

function suit_to_color(suit: Suit): SuitColor {
    switch (suit) {
        case Suit.Clubs:
        case Suit.Spades:
            return SuitColor.Black;
        case Suit.Diamonds:
        case Suit.Hearts:
            return SuitColor.Red;
        default:
            return SuitColor.Undefined;
    }
}

function colorFlip(color: SuitColor): SuitColor {
    switch (color) {
        case SuitColor.Black: return SuitColor.Red;
        case SuitColor.Red: return SuitColor.Black;
        default: return SuitColor.Undefined;
    }
}

// https://github.com/lufebe16/freecell4maemo/blob/master/src/freecell.py#L181

function cardnum_to_sym(cn: number) {
    if (cn < NumCards) {
        let cc = cn % CardsPerSuit;
        let cs = Math.floor(cn / CardsPerSuit);
        return CardSym[cc] + SuitSym[cs];
    } else {
        return "";
    }
}

function cardsym_to_num(ss: string) {
    let cc = Math.max(CardSym.indexOf(ss[0]), 0);
    let cs = Math.max(SuitSym.indexOf(ss[1]), 0);
    return cs * CardsPerSuit + cc;
}

function cardnum_to_text(cn: number) {
    if (cn < NumCards) {
        let cc = cn % CardsPerSuit;
        let cs = Math.floor(cn / CardsPerSuit);
        return `${SuitNames[cc]} ${CardNmaes[cs]}`;
    } else {
        return "";
    }
}

// https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L525

class Rect {
    public constructor(
        public left: number,
        public top: number,
        public width: number,
        public height: number
    ) { }

    public setRect(left: number, top: number, width: number, height: number) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    public enclosesXY(x: number, y: number) {
        // Determine if a point lies within the Rect
        return ((x >= this.left) && (x < this.left + this.width) && (y >= this.top) && (y < this.top + this.height));
    }

    public unionWith(otherRect: Rect) {
        // Modify the Rect to include another Rect
        let left = Math.min(this.left, otherRect.left);
        let right = Math.max(this.left + this.width, otherRect.left + otherRect.width);
        let top = Math.min(this.top, otherRect.top);
        let bottom = Math.max(this.top + this.height, otherRect.top + otherRect.height);

        this.left = left;
        this.top = top;
        this.width = (right - left);
        this.height = (bottom - top);
    }

    public clone(): Rect {
        return new Rect(this.left, this.top, this.width, this.height);
    }
}

// https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L583

class Card {
    public cardIsMoving: boolean = false;
    public selected: boolean = false;

    public constructor(
        public cardNum: number,
        public rect: Rect
    ) { }

    public getSuit() {
        return Math.floor(this.cardNum / CardsPerSuit);
    }

    public getSuitColor() {
        return suit_to_color(this.getSuit());
    }

    public getValue() {
        return this.cardNum % CardsPerSuit;
    }

    public enclosesXY(x: number, y: number) {
        return this.rect.enclosesXY(x, y);
    }

    public draw(e: DrawArgs) {
        const num = this.cardNum >= 0 ? this.cardNum : CardBacks.Blank;
        e.context.drawImage(
            e.cards, CardGraphicsWidth * num, this.selected ? CardGraphicsHeight : 0,
            CardGraphicsWidth, CardGraphicsHeight,
            this.rect.left, this.rect.top,
            this.rect.width, this.rect.height
        );
    }
}

class CardStack {
    // An object representing a stack of cards
    // The CardStack contains a list of Card objects, possesses an onscreen location
    // The CardStack's yOffset controls the vertical offset of cards in the stack

    public cards: Card[] = [];
    public rect: Rect;
    public yOffset: number = 0;

    public constructor(
        public left: number,
        public top: number,
        public stackSuit: Suit,
        public type: StackType
    ) {
        //this.rect = new Rect(left, top, CardGraphicsWidth, CardGraphicsHeight);
        this._reposition();
    }

    public getNumCards(): number {
        return this.cards.length;
    }

    public clearStack() {
        this.cards = [];
    }

    private _reposition() {
        this.rect = new Rect(
            this.left,
            this.top,
            CardGraphicsWidth,
            CardGraphicsHeight + this.yOffset * this.cards.length
        );

        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].rect = new Rect(this.left, this.top + this.yOffset * i, CardGraphicsWidth, CardGraphicsHeight);
        }
    }

    public setLeftTop(left: number, top: number) {
        this.left = left;
        this.top = top;
        this.yOffset = this.type === StackType.Regular ? CardGraphicsHeight / 4.8 : 0;
        this._reposition();
    }

    public pushCard(card: Card) {
        this.cards.push(card);
        this._reposition();
    }

    public getCard(cardIndex: number): Card | null {
        // Gets the card in a specific position on the card stack
        // negative numbers count from the end (ala Python)

        if (cardIndex < 0) cardIndex = this.cards.length + cardIndex;
        return (cardIndex < 0 || cardIndex >= this.cards.length) ? null : this.cards[cardIndex];
    }

    // Get the card value, suit, and colour of a card on the CardStack
    // negative cardIndex values work like in python (e.g. -1 is last/top card);
    // if a bad index value is supplied, return the stack suit (i.e. ace stack suit)
    public getCardValueSuitColor(cardIndex: number): [number, Suit, SuitColor] {
        let card = this.getCard(cardIndex);
        if (card) {
            return [card.getValue(), card.getSuit(), card.getSuitColor()];
        } else {
            return [-1, this.stackSuit, suit_to_color(this.stackSuit)];
        }
    }

    public getTopCardRect(): Rect {
        // Gets the rect of the top card on the card stack; return bare rect if there are no cards
        const topCard = this.getCard(-1);
        return topCard ? topCard.rect : this.rect;
    }

    public popCard(): Card | null {
        // Remove the top card on the CardStack; return the popped Card or None
        if (this.cards.length > 0) {
            const card = this.cards.pop();
            this._reposition();
            return card || null;
        } else {
            return null;
        }
    }

    public enclosesXy(x: number, y: number): boolean {
        return this.rect.enclosesXY(x, y);
    }

    public clearSelection() {
        for (let card of this.cards) {
            card.selected = false;
        }
    }

    public draw(e: DrawArgs) {
        if (this.cards.length > 0) {
            //console.log("drawing a stack of %o cards at %o,%o", this.cards.length, this.rect.left, this.rect.top);
            for (let card of this.cards) {
                card.draw(e);
            }
        } else {
            let back: number = 0;

            switch (this.stackSuit) {
                case Suit.Clubs: back = CardBacks.Clubs; break;
                case Suit.Diamonds: back = CardBacks.Diamonds; break;
                case Suit.Spades: back = CardBacks.Spades; break;
                case Suit.Hearts: back = CardBacks.Hearts; break;
                default: back = CardBacks.Blank; break;
            }

            //console.log("drawing a stack with back %o at %o,%o", back, this.rect.left, this.rect.top);

            e.context.drawImage(
                e.cards, CardGraphicsWidth * back, 0,
                CardGraphicsWidth, CardGraphicsHeight,
                this.rect.left, this.rect.top,
                this.rect.width, this.rect.height
            );
        }

    }
}

// https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L941

class FreeCell {
    public freecellStacks: CardStack[];
    public acesStacks: CardStack[];
    public mainCardStacks: CardStack[];

    //Keep track of all card stack moves so we can undo moves (and redo those undos)
    public undoStack: string[] = [];
    public redoStack: string[] = [];

    // we're going to hard code this for now and
    // let the canvas itself scale (since we're still
    // limited by the raster card images)
    public screenWidth: number = 730;

    // Track the currently selected card
    public selectedCardRect: Rect | null = null;
    public selectedCardStack: CardStack | null = null;
    public selectedCardType: StackType = StackType.Undefined;

    public startingCardOrder: number[] = [];

    public constructor() {
        // Set up the free cells (4 cells in top left of screen)
        this.freecellStacks = [];
        for (let i = 0; i < NumFreeCells; i++) {
            this.freecellStacks.push(new CardStack(0, 0, Suit.Undefined, StackType.Freecell));
        }

        // Set up the "aces" (4 cells in top right of screen); order is important
        this.acesStacks = [];
        for (let i = 0; i < NumAces; i++) {
            this.acesStacks.push(new CardStack(0, 0, i, StackType.Ace));
        }

        // Set up the columns
        this.mainCardStacks = [];
        for (let i = 0; i < NumColumns; i++) {
            this.mainCardStacks.push(new CardStack(0, 0, Suit.Undefined, StackType.Regular));
        }

        // Set up the card deck
        for (let i = 0; i < NumCards; i++) {
            this.startingCardOrder.push(i);
        }
    }

    public compare_stack(stack: CardStack): [StackType, number] {
        for (let i = 0; i < this.freecellStacks.length; i++) {
            if (this.freecellStacks[i] === stack) return [StackType.Freecell, i];
        }
        for (let i = 0; i < this.acesStacks.length; i++) {
            if (this.acesStacks[i] === stack) return [StackType.Ace, i];
        }
        for (let i = 0; i < this.mainCardStacks.length; i++) {
            if (this.mainCardStacks[i] === stack) return [StackType.Regular, i];
        }
        return [StackType.Undefined, -1];
    }

    public retrieve_stack(stack: StackType) {
        switch (stack) {
            case StackType.Freecell: return this.freecellStacks;
            case StackType.Ace: return this.acesStacks;
            default: return this.mainCardStacks;
        }
    }

    public forEachStack(callback: (stack: CardStack, stackType: StackType, index: number) => undefined) {
        for (let i = 0; i < this.freecellStacks.length; i++) {
            callback(this.freecellStacks[i], StackType.Freecell, i);
        }
        for (let i = 0; i < this.acesStacks.length; i++) {
            callback(this.acesStacks[i], StackType.Ace, i);
        }
        for (let i = 0; i < this.mainCardStacks.length; i++) {
            callback(this.mainCardStacks[i], StackType.Regular, i);
        }
    }

    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1267

    // TODO: save_current_game
    // TODO: read_current_game

    // TODO: undo/redo

    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1539

    public setupCards(newGame: boolean = true) {
        if (newGame) {
            this.undoStack = [];
            this.redoStack = [];

            for (let i = this.startingCardOrder.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * i);
                let temp = this.startingCardOrder[i];
                this.startingCardOrder[i] = this.startingCardOrder[j];
                this.startingCardOrder[j] = temp;
            }
        }

        this.acesStacks.forEach(x => x.clearStack());
        this.freecellStacks.forEach(x => x.clearStack());
        this.mainCardStacks.forEach(x => x.clearStack());

        // deal out cards to main stacks
        console.log("starting card order: %o", this.startingCardOrder);
        for (let i = 0; i < this.startingCardOrder.length; i++) {
            this.mainCardStacks[i % NumColumns].pushCard(new Card(this.startingCardOrder[i], new Rect(0, 0, 0, 0)));
        }

        this.setCardRects();
    }

    //  Get a rect that encloses all the cards in the given list of CardStacks
    public getStackListEnclosingRect(cardStackList: CardStack[]): Rect {
        let rect = cardStackList[0].rect.clone();
        for (let i = 0; i < cardStackList.length; i++) {
            rect.unionWith(cardStackList[i].rect);
        }
        return rect;
    }

    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1572

    // Set the position of all card stacks; this is done in response to a configure event
    public setCardRects() {
        let cardHorizSpacing = this.screenWidth / 8;

        this.mainCardStacks.forEach(function (stack: CardStack, i: number) {
            const x = Math.round(i * cardHorizSpacing + (CardGraphicsHeight - CardGraphicsWidth) / 2);
            stack.setLeftTop(x, VertSeparatorWidth + VertSeparatorWidth + CardGraphicsHeight);
        });

        cardHorizSpacing = this.screenWidth / 8.5;

        this.freecellStacks.forEach(function (stack: CardStack, i: number) {
            const x = Math.round(i * cardHorizSpacing + (CardGraphicsHeight - CardGraphicsWidth) / 2);
            stack.setLeftTop(x, VertSeparatorWidth);
        });

        this.acesStacks.forEach(function (stack: CardStack, i: number) {
            const x = Math.round((i + NumFreeCells + 0.5) * cardHorizSpacing + (CardGraphicsHeight - CardGraphicsWidth) / 2);
            stack.setLeftTop(x, VertSeparatorWidth);
        });
    }

    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1676

    public clearCardSelection() {
        this.clearSelecions();
        this.selectedCardRect = null;
        this.selectedCardStack = null;
        this.selectedCardType = StackType.Undefined;
    }

    public setCardSelection(stackType: StackType, cardStack: CardStack, cardRect: Rect) {
        this.clearCardSelection();

        if (cardStack.getNumCards() > 0) {
            this.selectedCardRect = cardRect;
            this.selectedCardType = stackType;
            this.selectedCardStack = cardStack;

            cardStack.getCard(-1)!.selected = true;
        }
    }

    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1705
    public moveCard(srcStack: CardStack, destStack: CardStack) {
        if (srcStack === destStack) return;

        // TODO: animation
        const card = srcStack.popCard();
        if (card) destStack.pushCard(card);
    }

    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1812

    public clearSelecions() {
        this.freecellStacks.forEach(x => x.clearSelection());
        this.acesStacks.forEach(x => x.clearSelection());
        this.mainCardStacks.forEach(x => x.clearSelection());
    }
    // Determine the card/stack at a given (x,y); return the type, rect, cardStack of the target
    public xyToCardStackInfo(x: number, y: number): [StackType, CardStack | null] {
        let hitType = StackType.Undefined;
        let hitStack: CardStack | null = null;

        this.forEachStack((stack, type) => {
            if (stack.enclosesXy(x, y)) {
                hitStack = stack;
                hitType = type;
            }
        });

        return [hitType, hitStack];
    }

    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1867

    // This is the "bug, ugly one" -- all the gameplay rules are implemented here...
    // (I may end up refacotring this once I verify the TS port works.)
    public button_press_event(x: number, y: number) {
        const [destType, destStack] = this.xyToCardStackInfo(x, y);

        if (destType === StackType.Undefined || !destStack) {
            // Didn't click on a valid target, so clear the previous click selection and bail
            this.clearSelecions();
        }
        else if (this.selectedCardType === StackType.Undefined || !this.selectedCardStack) {
            // There was no previous selection, so try
            this.setCardSelection(destType, destStack, destStack.rect);
        }
        else {
            // A card is currenlty selected, so see if it can be moved to the target
            let moved = false;

            const srcNumCards = this.selectedCardStack.getNumCards();
            const [srcCardVal, srcSuit, srcSuitColor] = this.selectedCardStack.getCardValueSuitColor(-1);

            const destNumCards = destStack.getNumCards();
            const [destCardVal, destSuit, destSuitColor] = destStack.getCardValueSuitColor(-1);

            const destSrcDelta = destCardVal - srcCardVal;

            let numFreeCells = 0;
            this.freecellStacks.forEach(s => { if (s.getNumCards() <= 0) numFreeCells++; });

            let runLength = 0;
            for (let i = 0; i < srcNumCards; i++) {
                let [cardVal, , cardSuitColor] = this.selectedCardStack.getCardValueSuitColor(srcNumCards - i - 1);
                if (cardVal === srcCardVal + i && cardSuitColor === colorFlip(srcSuitColor)) {
                    runLength++;
                } else {
                    break;
                }
            }

            const suitColorsWork = srcSuitColor === colorFlip(destSuitColor);
            const srcRunMeetsDst = destSrcDelta > 0 && runLength >= destSrcDelta;

            function columnMove(count: number) {
                console.log("columnMove(%o)", count);

                const tempStacks: number[] = [];

                for (let i = 0; i < count; i++) {
                    for (let j = 0; j < NumFreeCells; j++) {
                        if (this.freecellStacks[j].getNumCards() <= 0) {
                            this.moveCard(this.selectedCardStack, this.freecellStacks[j]);
                            tempStacks.unshift(j);
                        }
                    }
                }

                this.moveCard(this.selectedCardStack, destStack);
                for (let s of tempStacks) this.moveCard(this.freecellStacks[s], destStack);
            }

            if (destType === StackType.Freecell) {
                // Move selected card to a free cell, if it is open
                if (destNumCards <= 0) {
                    this.moveCard(this.selectedCardStack, destStack);
                    moved = true;
                }
            } else if (destType === StackType.Ace) {
                // Move selected card to an ace stack, if it matches suit and is in order
                if (srcSuit === destSuit && srcCardVal === destCardVal + 1) {
                    this.moveCard(this.selectedCardStack, destStack);
                    moved = true;
                }
            } else if (destNumCards <= 0 && runLength <= 1) {
                // Move a single card to an empty stack
                this.moveCard(this.selectedCardStack, destStack);
                moved = true;
            } else if (destNumCards <= 0 && runLength > 1) {
                // Move multiple cards to an empty stack
                columnMove(Math.min(numFreeCells, runLength - 1));
                moved = true;
            } else if (srcRunMeetsDst && suitColorsWork) {
                // Move a column onto another card (column could be just a single card, really)
                columnMove(destSrcDelta - 1);
                moved = true;
            }

            // Clear selection
            this.clearCardSelection();
            if (!moved) this.setCardSelection(destType, destStack, destStack.rect);
        }
    }

    public draw(e: DrawArgs) {
        this.forEachStack(stack => { stack.draw(e) });
    }
}

// Here is the wholly original code in order to
// draw the webpage and interact with the game

class DrawArgs {
    public constructor(
        public context: CanvasRenderingContext2D,
        public cards: HTMLImageElement
    ) { }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function main() {
    const gameCanvas: any = document.getElementById("gameCanvas")!;

    const cards = await loadImage("cards.png");

    // init the freecell game
    const freecell = new FreeCell();
    freecell.setupCards(true);

    function draw() {
        const ctx: CanvasRenderingContext2D = gameCanvas!.getContext("2d");

        ctx.fillStyle = "#006600";
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

        const e = new DrawArgs(ctx, cards);
        freecell.draw(e);
    }

    gameCanvas.addEventListener("click", function (e: MouseEvent) {
        const x = e.offsetX;
        const y = e.offsetY;
        freecell.button_press_event(x, y);
        draw();
    });

    draw();
}

document.addEventListener("DOMContentLoaded", main);
