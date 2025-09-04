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
var Suit;
(function (Suit) {
    Suit[Suit["Clubs"] = 0] = "Clubs";
    Suit[Suit["Diamonds"] = 1] = "Diamonds";
    Suit[Suit["Spades"] = 2] = "Spades";
    Suit[Suit["Hearts"] = 3] = "Hearts";
    Suit[Suit["Undefined"] = -1] = "Undefined";
})(Suit || (Suit = {}));
const SuitNames = ["Clubs", "Diamonds", "Spades", "Hearts"];
const CardNmaes = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Knight", "Queen", "King"];
const SuitSym = ["C", "D", "S", "H"];
const CardSym = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
// Suit colors
var SuitColor;
(function (SuitColor) {
    SuitColor[SuitColor["Black"] = 0] = "Black";
    SuitColor[SuitColor["Red"] = 1] = "Red";
    SuitColor[SuitColor["Undefined"] = -1] = "Undefined";
})(SuitColor || (SuitColor = {}));
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
var StackType;
(function (StackType) {
    StackType[StackType["Freecell"] = 0] = "Freecell";
    StackType[StackType["Ace"] = 1] = "Ace";
    StackType[StackType["Regular"] = 2] = "Regular";
    StackType[StackType["Undefined"] = -1] = "Undefined";
})(StackType || (StackType = {}));
const StackTypeName = ["FreeCell", "AceStack", "PlayStack"];
const CardGraphicsWidth = 73;
const CardGraphicsHeight = 97;
function suit_to_color(suit) {
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
function colorFlip(color) {
    switch (color) {
        case SuitColor.Black: return SuitColor.Red;
        case SuitColor.Red: return SuitColor.Black;
        default: return SuitColor.Undefined;
    }
}
// https://github.com/lufebe16/freecell4maemo/blob/master/src/freecell.py#L181
function cardnum_to_sym(cn) {
    if (cn < NumCards) {
        let cc = cn % CardsPerSuit;
        let cs = Math.floor(cn / CardsPerSuit);
        return CardSym[cc] + SuitSym[cs];
    }
    else {
        return "";
    }
}
function cardsym_to_num(ss) {
    let cc = Math.max(CardSym.indexOf(ss[0]), 0);
    let cs = Math.max(SuitSym.indexOf(ss[1]), 0);
    return cs * CardsPerSuit + cc;
}
function cardnum_to_text(cn) {
    if (cn < NumCards) {
        let cc = cn % CardsPerSuit;
        let cs = Math.floor(cn / CardsPerSuit);
        return `${SuitNames[cc]} ${CardNmaes[cs]}`;
    }
    else {
        return "";
    }
}
// https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L525
class Rect {
    left;
    top;
    width;
    height;
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    setRect(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    enclosesXY(x, y) {
        // Determine if a point lies within the Rect
        return ((x >= this.left) && (x < this.left + this.width) && (y >= this.top) && (y < this.top + this.height));
    }
    unionWith(otherRect) {
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
    clone() {
        return new Rect(this.left, this.top, this.width, this.height);
    }
}
// https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L583
class Card {
    cardNum;
    rect;
    cardIsMoving = false;
    selected = false;
    constructor(cardNum, rect) {
        this.cardNum = cardNum;
        this.rect = rect;
    }
    getSuit() {
        return Math.floor(this.cardNum / CardsPerSuit);
    }
    getSuitColor() {
        return suit_to_color(this.getSuit());
    }
    getValue() {
        return this.cardNum % CardsPerSuit;
    }
    enclosesXY(x, y) {
        return this.rect.enclosesXY(x, y);
    }
    draw(e) {
        const num = this.cardNum >= 0 ? this.cardNum : CardBacks.Blank;
        e.context.drawImage(e.cards, CardGraphicsWidth * num, this.selected ? CardGraphicsHeight : 0, CardGraphicsWidth, CardGraphicsHeight, this.rect.left, this.rect.top, this.rect.width, this.rect.height);
    }
    toString() {
        return CardSym[this.getValue()] + SuitSym[this.getSuit()];
    }
    // If this card will "accept" a card after it (i.e., if this card is the opposite color too and one rank above nextCard)
    willAcceptCard(nextCard) {
        if (!nextCard)
            return false;
        if (this.getSuitColor() === nextCard.getSuitColor())
            return false;
        const value = this.getValue();
        if (value === 0)
            return false; // aces can never accept anything
        return value === (nextCard.getValue() + 1);
    }
}
class CardStack {
    left;
    top;
    stackSuit;
    type;
    // An object representing a stack of cards
    // The CardStack contains a list of Card objects, possesses an onscreen location
    // The CardStack's yOffset controls the vertical offset of cards in the stack
    cards = [];
    rect;
    yOffset = 0;
    constructor(left, top, stackSuit, type) {
        this.left = left;
        this.top = top;
        this.stackSuit = stackSuit;
        this.type = type;
        //this.rect = new Rect(left, top, CardGraphicsWidth, CardGraphicsHeight);
        this._reposition();
    }
    getNumCards() {
        return this.cards.length;
    }
    clearStack() {
        this.cards = [];
    }
    _reposition() {
        this.rect = new Rect(this.left, this.top, CardGraphicsWidth, CardGraphicsHeight + this.yOffset * this.cards.length);
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].rect = new Rect(this.left, this.top + this.yOffset * i, CardGraphicsWidth, CardGraphicsHeight);
        }
    }
    setLeftTop(left, top) {
        this.left = left;
        this.top = top;
        this.yOffset = this.type === StackType.Regular ? CardGraphicsHeight / 4.8 : 0;
        this._reposition();
    }
    pushCard(card) {
        this.cards.push(card);
        this._reposition();
    }
    getCard(cardIndex) {
        // Gets the card in a specific position on the card stack
        // negative numbers count from the end (ala Python)
        // console.log("getCard(%o) of %s", cardIndex, this.cards.map(x => x.toString()).join(','));
        if (cardIndex < 0)
            cardIndex = this.cards.length + cardIndex;
        return (cardIndex < 0 || cardIndex >= this.cards.length) ? null : this.cards[cardIndex];
    }
    // Get the card value, suit, and colour of a card on the CardStack
    // negative cardIndex values work like in python (e.g. -1 is last/top card);
    // if a bad index value is supplied, return the stack suit (i.e. ace stack suit)
    getCardValueSuitColor(cardIndex) {
        let card = this.getCard(cardIndex);
        if (card) {
            return [card.getValue(), card.getSuit(), card.getSuitColor()];
        }
        else {
            return [-1, this.stackSuit, suit_to_color(this.stackSuit)];
        }
    }
    getTopCardRect() {
        // Gets the rect of the top card on the card stack; return bare rect if there are no cards
        const topCard = this.getCard(-1);
        return topCard ? topCard.rect : this.rect;
    }
    popCard() {
        // Remove the top card on the CardStack; return the popped Card or None
        if (this.cards.length > 0) {
            const card = this.cards.pop();
            this._reposition();
            return card || null;
        }
        else {
            return null;
        }
    }
    enclosesXy(x, y) {
        return this.rect.enclosesXY(x, y);
    }
    clearSelection() {
        for (let card of this.cards) {
            card.selected = false;
        }
    }
    draw(e) {
        if (this.cards.length > 0) {
            //console.log("drawing a stack of %o cards at %o,%o", this.cards.length, this.rect.left, this.rect.top);
            for (let card of this.cards) {
                card.draw(e);
            }
        }
        else {
            let back = 0;
            switch (this.stackSuit) {
                case Suit.Clubs:
                    back = CardBacks.Clubs;
                    break;
                case Suit.Diamonds:
                    back = CardBacks.Diamonds;
                    break;
                case Suit.Spades:
                    back = CardBacks.Spades;
                    break;
                case Suit.Hearts:
                    back = CardBacks.Hearts;
                    break;
                default:
                    back = CardBacks.Blank;
                    break;
            }
            //console.log("drawing a stack with back %o at %o,%o", back, this.rect.left, this.rect.top);
            e.context.drawImage(e.cards, CardGraphicsWidth * back, 0, CardGraphicsWidth, CardGraphicsHeight, this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        }
    }
}
// https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L941
class FreeCell {
    freecellStacks;
    acesStacks;
    mainCardStacks;
    //Keep track of all card stack moves so we can undo moves (and redo those undos)
    undoStack = [];
    redoStack = [];
    // we're going to hard code this for now and
    // let the canvas itself scale (since we're still
    // limited by the raster card images)
    screenWidth = 730;
    // Track the currently selected card
    selectedCardRect = null;
    selectedCardStack = null;
    selectedCardType = StackType.Undefined;
    startingCardOrder = [];
    constructor() {
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
    compare_stack(stack) {
        for (let i = 0; i < this.freecellStacks.length; i++) {
            if (this.freecellStacks[i] === stack)
                return [StackType.Freecell, i];
        }
        for (let i = 0; i < this.acesStacks.length; i++) {
            if (this.acesStacks[i] === stack)
                return [StackType.Ace, i];
        }
        for (let i = 0; i < this.mainCardStacks.length; i++) {
            if (this.mainCardStacks[i] === stack)
                return [StackType.Regular, i];
        }
        return [StackType.Undefined, -1];
    }
    retrieve_stack(stack) {
        switch (stack) {
            case StackType.Freecell: return this.freecellStacks;
            case StackType.Ace: return this.acesStacks;
            default: return this.mainCardStacks;
        }
    }
    forEachStack(callback) {
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
    setupCards(newGame = true) {
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
        //console.log("starting card order: %o", this.startingCardOrder);
        for (let i = 0; i < this.startingCardOrder.length; i++) {
            this.mainCardStacks[i % NumColumns].pushCard(new Card(this.startingCardOrder[i], new Rect(0, 0, 0, 0)));
        }
        this.setCardRects();
    }
    //  Get a rect that encloses all the cards in the given list of CardStacks
    getStackListEnclosingRect(cardStackList) {
        let rect = cardStackList[0].rect.clone();
        for (let i = 0; i < cardStackList.length; i++) {
            rect.unionWith(cardStackList[i].rect);
        }
        return rect;
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1572
    // Set the position of all card stacks; this is done in response to a configure event
    setCardRects() {
        let cardHorizSpacing = this.screenWidth / 8;
        this.mainCardStacks.forEach(function (stack, i) {
            const x = Math.round(i * cardHorizSpacing + (CardGraphicsHeight - CardGraphicsWidth) / 2);
            stack.setLeftTop(x, VertSeparatorWidth + VertSeparatorWidth + CardGraphicsHeight);
        });
        cardHorizSpacing = this.screenWidth / 8.5;
        this.freecellStacks.forEach(function (stack, i) {
            const x = Math.round(i * cardHorizSpacing + (CardGraphicsHeight - CardGraphicsWidth) / 2);
            stack.setLeftTop(x, VertSeparatorWidth);
        });
        this.acesStacks.forEach(function (stack, i) {
            const x = Math.round((i + NumFreeCells + 0.5) * cardHorizSpacing + (CardGraphicsHeight - CardGraphicsWidth) / 2);
            stack.setLeftTop(x, VertSeparatorWidth);
        });
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1676
    clearCardSelection() {
        this.clearSelecions();
        this.selectedCardRect = null;
        this.selectedCardStack = null;
        this.selectedCardType = StackType.Undefined;
    }
    setCardSelection(stackType, cardStack, cardRect) {
        this.clearCardSelection();
        if (cardStack.getNumCards() > 0) {
            this.selectedCardRect = cardRect;
            this.selectedCardType = stackType;
            this.selectedCardStack = cardStack;
            cardStack.getCard(-1).selected = true;
        }
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1705
    moveCard(srcStack, destStack) {
        if (srcStack === destStack)
            return;
        // TODO: animation
        const card = srcStack.popCard();
        if (card)
            destStack.pushCard(card);
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1812
    clearSelecions() {
        this.freecellStacks.forEach(x => x.clearSelection());
        this.acesStacks.forEach(x => x.clearSelection());
        this.mainCardStacks.forEach(x => x.clearSelection());
        this.selectedCardStack = null;
        this.selectedCardType = StackType.Undefined;
    }
    // Determine the card/stack at a given (x,y); return the type, rect, cardStack of the target
    xyToCardStackInfo(x, y) {
        let hitType = StackType.Undefined;
        let hitStack = null;
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
    button_press_event(x, y, overrideCardLogic = false) {
        const [destType, destStack] = this.xyToCardStackInfo(x, y);
        if (destType === StackType.Undefined || !destStack || destStack === this.selectedCardStack) {
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
            // const srcNumCards = this.selectedCardStack.getNumCards();
            const [srcCardVal, srcSuit, srcSuitColor] = this.selectedCardStack.getCardValueSuitColor(-1);
            const destNumCards = destStack.getNumCards();
            const [destCardVal, destSuit, destSuitColor] = destStack.getCardValueSuitColor(-1);
            let numFreeCells = 0;
            this.freecellStacks.forEach(s => { if (s.getNumCards() <= 0)
                numFreeCells++; });
            // I couldn't get the original code to work when porting over from Python, so I just winged a rewrite.
            let runLength = 1;
            let topCardOfRun = this.selectedCardStack.getCard(-1);
            while (true) {
                let aboveCard = this.selectedCardStack.getCard(-1 - runLength);
                if (aboveCard && aboveCard.willAcceptCard(topCardOfRun)) {
                    topCardOfRun = aboveCard;
                    runLength++;
                }
                else {
                    break;
                }
            }
            if (runLength > numFreeCells + 1)
                runLength = numFreeCells + 1;
            const this2 = this;
            function columnMove(count) {
                console.log("moving a column of %d card(s)", count);
                const tempStacks = [];
                for (let i = 0; i < count - 1; i++) {
                    for (let j = 0; j < NumFreeCells; j++) {
                        if (this2.freecellStacks[j].getNumCards() <= 0) {
                            this2.moveCard(this2.selectedCardStack, this2.freecellStacks[j]);
                            tempStacks.unshift(j);
                            break;
                        }
                    }
                }
                console.log("used %o tempstacks to move %o card(s)", tempStacks.length, count);
                this2.moveCard(this2.selectedCardStack, destStack);
                for (let s of tempStacks)
                    this2.moveCard(this2.freecellStacks[s], destStack);
            }
            if (destType === StackType.Freecell) {
                // Move selected card to a free cell, if it is open
                if (destNumCards <= 0) {
                    this.moveCard(this.selectedCardStack, destStack);
                    moved = true;
                }
            }
            else if (destType === StackType.Ace) {
                // Move selected card to an ace stack, if it matches suit and is in order
                if (srcSuit === destSuit && srcCardVal === destCardVal + 1) {
                    this.moveCard(this.selectedCardStack, destStack);
                    moved = true;
                }
            }
            else if (destNumCards <= 0 && runLength <= 1) {
                // Move a single card to an empty stack
                this.moveCard(this.selectedCardStack, destStack);
                moved = true;
            }
            else if (destNumCards <= 0 && runLength > 1) {
                // Move multiple cards to an empty stack
                columnMove(Math.min(numFreeCells, runLength) + 1);
                moved = true;
            }
            else {
                // Move a column onto another card (column could be just a single card, really)
                let destCard = destStack.getCard(-1);
                while (runLength > 0 && !moved) {
                    let testCard = this.selectedCardStack.getCard(-runLength);
                    if (destCard.willAcceptCard(testCard) || (runLength === 1 && overrideCardLogic)) {
                        columnMove(runLength);
                        moved = true;
                    }
                    else {
                        runLength--;
                    }
                }
            }
            // Clear selection
            this.clearCardSelection();
            if (!moved)
                this.setCardSelection(destType, destStack, destStack.rect);
        }
    }
    draw(e) {
        this.forEachStack(stack => { stack.draw(e); });
    }
}
// Here is the wholly original code in order to
// draw the webpage and interact with the game
class DrawArgs {
    context;
    cards;
    constructor(context, cards) {
        this.context = context;
        this.cards = cards;
    }
}
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
async function main() {
    const gameCanvas = document.getElementById("gameCanvas");
    const cards = await loadImage("cards.png");
    // init the freecell game
    const freecell = new FreeCell();
    freecell.setupCards(true);
    function draw() {
        const ctx = gameCanvas.getContext("2d");
        ctx.fillStyle = "#006600";
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        const e = new DrawArgs(ctx, cards);
        freecell.draw(e);
    }
    gameCanvas.addEventListener("click", function (e) {
        const x = e.offsetX;
        const y = e.offsetY;
        freecell.button_press_event(x, y, e.shiftKey);
        draw();
    });
    draw();
}
document.addEventListener("DOMContentLoaded", main);
//# sourceMappingURL=freecell.js.map