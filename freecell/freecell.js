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
const CardGraphicsWidth = 73;
const CardGraphicsHeight = 97;
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
    enclosesXY(x, y) {
        // Determine if a point lies within the Rect
        return ((x >= this.left) && (x < this.left + this.width) && (y >= this.top) && (y < this.top + this.height));
    }
    clone() {
        return new Rect(this.left, this.top, this.width, this.height);
    }
}
// https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L583
class Card {
    cardNum;
    cardIsMoving = false;
    selected = false;
    rect;
    constructor(cardNum, rect = null) {
        this.cardNum = cardNum;
        this.rect = rect || new Rect(0, 0, 0, 0);
    }
    getSuit() {
        return Math.floor(this.cardNum / CardsPerSuit);
    }
    getSuitColor() {
        switch (this.getSuit()) {
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
    getValue() {
        return this.cardNum % CardsPerSuit;
    }
    enclosesXY(x, y) {
        return this.rect.enclosesXY(x, y);
    }
    draw(e) {
        if (this.cardIsMoving)
            return;
        this.drawAt(e, this.rect);
    }
    drawAt(e, rect) {
        const num = this.cardNum >= 0 ? this.cardNum : CardBacks.Blank;
        e.context.drawImage(e.cards, CardGraphicsWidth * num, this.selected ? CardGraphicsHeight : 0, CardGraphicsWidth, CardGraphicsHeight, rect.left, rect.top, rect.width, rect.height);
    }
    toString() {
        return "A23456789TJQK"[this.getValue()] + "♣♦♠♥"[this.getSuit()];
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
    cardWidth = CardGraphicsWidth;
    cardHeight = CardGraphicsHeight;
    constructor(left, top, stackSuit, type) {
        this.left = left;
        this.top = top;
        this.stackSuit = stackSuit;
        this.type = type;
        this._reposition();
    }
    getNumCards() {
        return this.cards.length;
    }
    clearStack() {
        this.cards = [];
    }
    _reposition() {
        this.rect = new Rect(this.left, this.top, this.cardWidth, this.cardHeight + this.yOffset * this.cards.length);
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].rect = new Rect(this.left, this.top + this.yOffset * i, this.cardWidth, this.cardHeight);
        }
    }
    setLeftTop(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.yOffset = this.type === StackType.Regular ? this.cardHeight / 4 : 0;
        this.cardWidth = width;
        this.cardHeight = height;
        this._reposition();
    }
    pushCard(card) {
        this.cards.push(card);
        this._reposition();
    }
    getCard(cardIndex) {
        // Gets the card in a specific position on the card stack
        // negative numbers count from the end (ala Python)
        if (cardIndex < 0)
            cardIndex = this.cards.length + cardIndex;
        return (cardIndex < 0 || cardIndex >= this.cards.length) ? null : this.cards[cardIndex];
    }
    // Get the card value, suit, and colour of a card on the CardStack
    // negative cardIndex values work like in python (e.g. -1 is last/top card);
    // if a bad index value is supplied, return the stack suit (i.e. ace stack suit)
    getCardValueSuit(cardIndex) {
        let card = this.getCard(cardIndex);
        if (card) {
            return [card.getValue(), card.getSuit()];
        }
        else {
            return [-1, this.stackSuit];
        }
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
        if (this.cards.length === 0 || (this.cards.length === 1 && this.cards[0].cardIsMoving)) {
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
            e.context.drawImage(e.cards, CardGraphicsWidth * back, 0, CardGraphicsWidth, CardGraphicsHeight, this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        }
        else if (this.yOffset === 0) {
            // optimize drawing by only drawing the top card when there is no spread
            // (i.e. in the foundations)
            this.getCard(-1)?.draw(e);
        }
        else {
            for (let card of this.cards) {
                card.draw(e);
            }
        }
    }
}
class MoveAnimation {
    card;
    currentPosition;
    endPosition;
    speed;
    constructor(card, currentPosition, endPosition, speed = 700) {
        this.card = card;
        this.currentPosition = currentPosition;
        this.endPosition = endPosition;
        this.speed = speed;
    }
    process(delta) {
        // returns true if the animation is still ongoing, false if its completed
        const frameDistance = delta * this.speed;
        const deltaX = this.endPosition.left - this.currentPosition.left;
        const deltaY = this.endPosition.top - this.currentPosition.top;
        const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (totalDistance > frameDistance) {
            // move only a portion of the deistance
            const angleOfMovement = Math.atan2(deltaY, deltaX);
            this.currentPosition.left += Math.cos(angleOfMovement) * frameDistance;
            this.currentPosition.top += Math.sin(angleOfMovement) * frameDistance;
            return true;
        }
        else {
            // stopping the animation will just revewal the card's intended destination
            return false;
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
    // Track the currently selected card (stack)
    selectedCardStack = null;
    startingCardOrder = [];
    redrawRequested = false;
    //public moveAnimations: MoveAnimation[] = [];
    currentAnimation;
    moveQueue = [];
    animateFast = false;
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
    requestRedraw() {
        this.redrawRequested = true;
    }
    processAnimations(delta) {
        // return false if there are no animations to process, true if an animation is being processed
        if (this.currentAnimation) {
            if (!this.currentAnimation.process(delta)) {
                this.currentAnimation.card.cardIsMoving = false;
                this.currentAnimation = null;
                this.dequeueMove();
            }
            else {
                this.currentAnimation.card.cardIsMoving = true;
            }
            return true;
        }
        else {
            return false;
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
    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.exportGameState());
            this.applyGameState(this.undoStack.pop(), false);
            this.requestRedraw();
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.exportGameState());
            this.applyGameState(this.redoStack.pop(), false);
            this.requestRedraw();
        }
    }
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
        this.forEachStack(x => x.clearStack());
        // deal out cards to main stacks
        for (let i = 0; i < this.startingCardOrder.length; i++) {
            this.mainCardStacks[i % NumColumns].pushCard(new Card(this.startingCardOrder[i], new Rect(0, 0, 0, 0)));
        }
        this.reposition();
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1572
    // Set the position of all card stacks; this is done in response to a configure event
    reposition() {
        let cardHorizSpacing = this.screenWidth / 8;
        const cardWidth = this.screenWidth / 10;
        const cardHeight = cardWidth / 73 * 97;
        let vertSeparatorWidth = VertSeparatorWidth * cardWidth / CardGraphicsWidth;
        this.mainCardStacks.forEach(function (stack, i) {
            const x = Math.round(i * cardHorizSpacing + (cardHeight - cardWidth) / 2);
            stack.setLeftTop(x, vertSeparatorWidth + vertSeparatorWidth + cardHeight, cardWidth, cardHeight);
        });
        cardHorizSpacing = this.screenWidth / 8.5;
        this.freecellStacks.forEach(function (stack, i) {
            const x = Math.round(i * cardHorizSpacing + (cardHeight - cardWidth) / 2);
            stack.setLeftTop(x, vertSeparatorWidth, cardWidth, cardHeight);
        });
        this.acesStacks.forEach(function (stack, i) {
            const x = Math.round((i + NumFreeCells + 0.5) * cardHorizSpacing + (cardHeight - cardWidth) / 2);
            stack.setLeftTop(x, vertSeparatorWidth, cardWidth, cardHeight);
        });
        this.requestRedraw();
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1676
    clearCardSelection() {
        this.clearSelecions();
        //this.selectedCardRect = null;
        this.selectedCardStack = null;
        //this.selectedCardType = StackType.Undefined;
    }
    setCardSelection(stackType, cardStack, cardRect) {
        this.clearCardSelection();
        if (cardStack.getNumCards() > 0) {
            //this.selectedCardRect = cardRect;
            //this.selectedCardType = stackType;
            this.selectedCardStack = cardStack;
            cardStack.getCard(-1).selected = true;
        }
        this.requestRedraw();
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1705
    moveCard(srcStack, destStack) {
        if (srcStack === destStack)
            return;
        const card = srcStack.popCard();
        if (card) {
            const currentPosition = card.rect.clone();
            card.cardIsMoving = true;
            card.selected = false;
            destStack.pushCard(card);
            this.currentAnimation = new MoveAnimation(card, currentPosition, card.rect.clone(), this.screenWidth * (this.animateFast ? 2 : 1.5));
        }
    }
    queueMove(srcStack, destStack) {
        if (srcStack === destStack)
            return;
        this.moveQueue.push([srcStack, destStack]);
    }
    dequeueMove() {
        const m = this.moveQueue.shift();
        if (m) {
            this.moveCard(m[0], m[1]);
            return true;
        }
        else {
            return false;
        }
    }
    // https://github.com/lufebe16/freecell4maemo/blob/4545ca58af1e350d1ead19d4369d840d8c59d199/src/freecell.py#L1812
    clearSelecions() {
        this.freecellStacks.forEach(x => x.clearSelection());
        this.acesStacks.forEach(x => x.clearSelection());
        this.mainCardStacks.forEach(x => x.clearSelection());
        this.selectedCardStack = null;
        // this.selectedCardType = StackType.Undefined;
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
        // Disallow doing anything during a move animation
        if (this.currentAnimation)
            return;
        const [destType, destStack] = this.xyToCardStackInfo(x, y);
        const stateBeforeMoving = this.exportGameState();
        if (destType === StackType.Undefined || !destStack || destStack === this.selectedCardStack) {
            // Didn't click on a valid target, so clear the previous click selection and bail
            this.clearSelecions();
        }
        else if (!this.selectedCardStack) {
            // There was no previous selection, so try
            this.setCardSelection(destType, destStack, destStack.rect);
        }
        else {
            // A card is currenlty selected, so see if it can be moved to the target
            let moved = false;
            this.animateFast = false;
            const [srcCardVal, srcSuit] = this.selectedCardStack.getCardValueSuit(-1);
            const destNumCards = destStack.getNumCards();
            const [destCardVal, destSuit] = destStack.getCardValueSuit(-1);
            let numFreeCells = 0;
            this.freecellStacks.forEach(s => { if (s.getNumCards() <= 0)
                numFreeCells++; });
            // I couldn't get the original code to work when porting over from Python, so I just winged a rewrite.
            let runLength = 1;
            let topCardOfRun = this.selectedCardStack.getCard(-1);
            while (true) {
                let aboveCard = this.selectedCardStack.getCard(-1 - runLength);
                if (aboveCard && aboveCard.willAcceptCard(topCardOfRun) && runLength <= numFreeCells) {
                    topCardOfRun = aboveCard;
                    runLength++;
                }
                else {
                    break;
                }
            }
            if (runLength > numFreeCells + 1)
                runLength = numFreeCells + 1;
            if (this.selectedCardStack.type !== StackType.Regular)
                runLength = 1; // don't allow moving more than one card out of the foundation at a time
            const this2 = this;
            function columnMove(count) {
                const tempStacks = [];
                for (let i = 1, j = 0; i < count && j < NumFreeCells; j++) {
                    if (this2.freecellStacks[j].getNumCards() <= 0) {
                        this2.queueMove(this2.selectedCardStack, this2.freecellStacks[j]);
                        tempStacks.unshift(j);
                        i++;
                    }
                }
                this2.animateFast = tempStacks.length > 0;
                this2.queueMove(this2.selectedCardStack, destStack);
                for (let s of tempStacks)
                    this2.queueMove(this2.freecellStacks[s], destStack);
                this2.dequeueMove();
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
                columnMove(runLength);
                moved = true;
            }
            else {
                // Move a column onto another card (column could be just a single card, really)
                let destCard = destStack.getCard(-1);
                while (runLength > 0 && !moved) {
                    let testCard = this.selectedCardStack.getCard(-runLength);
                    let destWillAccept = destCard.willAcceptCard(testCard);
                    if (destWillAccept || (runLength === 1 && overrideCardLogic)) {
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
            if (moved) {
                this.redoStack = [];
                this.undoStack.push(stateBeforeMoving);
            }
            else {
                this.setCardSelection(destType, destStack, destStack.rect);
            }
            this.requestRedraw();
        }
    }
    draw(e) {
        this.forEachStack(stack => { stack.draw(e); });
        if (this.currentAnimation) {
            this.currentAnimation.card.drawAt(e, this.currentAnimation.currentPosition);
        }
    }
    exportGameState(includeStartingCards = true) {
        const gameState = {};
        this.forEachStack((stack, type, index) => {
            const stackid = `s${type}${index}`;
            gameState[stackid] = stack.cards.map(x => x.cardNum);
        });
        if (includeStartingCards) {
            gameState.startingCards = this.startingCardOrder;
        }
        return JSON.stringify(gameState);
    }
    applyGameState(state, resetExistingGameState = false) {
        this.clearSelecions();
        const gameState = JSON.parse(state);
        this.forEachStack((stack, type, index) => {
            stack.clearStack();
            const stackid = `s${type}${index}`;
            if (gameState[stackid]) {
                stack.cards = gameState[stackid].map(x => new Card(x));
            }
        });
        if (gameState.startingCardOrder && resetExistingGameState) {
            this.startingCardOrder = gameState.startingCardOrder;
        }
        if (resetExistingGameState) {
            this.undoStack = [];
            this.redoStack = [];
        }
        this.reposition();
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
    // Game logic and display
    const gameCanvas = document.getElementById("gameCanvas");
    const canvasContainer = document.getElementById("canvasContainer");
    const cards = await loadImage("cards.png");
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
    let lastFrameTime = 0;
    let lastPageSize = { width: -1, height: -1 };
    function animationFrame(time) {
        let delta = (time - lastFrameTime) / 1000;
        lastFrameTime = time;
        if (canvasContainer.offsetWidth !== lastPageSize.width || canvasContainer.offsetHeight !== lastPageSize.height) {
            lastPageSize.width = canvasContainer.offsetWidth;
            lastPageSize.height = canvasContainer.offsetHeight;
            gameCanvas.width = lastPageSize.width - 32;
            gameCanvas.height = lastPageSize.height - 32;
            freecell.screenWidth = lastPageSize.width - 32;
            freecell.reposition();
            freecell.requestRedraw();
        }
        if (freecell.processAnimations(delta) || freecell.redrawRequested) {
            draw();
            freecell.redrawRequested = false;
        }
        window.requestAnimationFrame(animationFrame);
    }
    gameCanvas.addEventListener("click", function (e) {
        const x = e.offsetX;
        const y = e.offsetY;
        freecell.button_press_event(x, y, e.shiftKey);
        draw();
    });
    // User interface
    document.getElementById("undo").onclick = () => freecell.undo();
    document.getElementById("redo").onclick = () => freecell.redo();
    document.getElementById("reset").onclick = () => freecell.setupCards(false);
    document.getElementById("new").onclick = () => freecell.setupCards(true);
    document.getElementById("about").onclick = () => document.getElementById("about-dialog")?.showModal();
    for (let button of document.querySelectorAll("#toolbar button")) {
        let label = document.createElement("div");
        label.popover = "auto";
        label.setAttribute("for", button.id);
        label.classList.add("tooltip");
        label.id = button.id + "-tooltip";
        label.textContent = button.getAttribute("title");
        document.body.appendChild(label);
        button.addEventListener("mouseleave", function () {
            document.getElementById(this.id + "-tooltip")?.hidePopover();
        });
        button.addEventListener("mouseover", function () {
            const label = document.getElementById(this.id + "-tooltip");
            if (label) {
                label.style.top = this.offsetTop + "px";
                label.showPopover();
            }
        });
    }
    // Start the game
    animationFrame(1);
}
document.addEventListener("DOMContentLoaded", main);
//# sourceMappingURL=freecell.js.map