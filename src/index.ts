import puppeteer, { Page, ElementHandle } from 'puppeteer';

declare global {
    interface Window {
        Font: any
    }
}

const svgToValue = (
    Font: any,
    gameCellValues: string[],
) => {
    const gameCellValuesRaw = gameCellValues.map((gameCellValue) => {
        for (let i = 1; i <= 9; i += 1) {
            if (Font[i].slice(0, -8) === gameCellValue.slice(0, -14)) {
                return i;
            }
        }
        return 0;
    })
    return Array.from({ length: 9 }).map((el, index) => gameCellValuesRaw.slice(9 * index, 9 * index + 9));
};

const sliceToSudokuStyle = (gameTable: number[]) => Array
    .from({ length: 9 })
    .map((el, index) => gameTable.slice(index * 9, index * 9 + 9));

const sleep = (time: number) => new Promise((resolve) => setTimeout(() => resolve(), time));

const findEmptyCell = (
    gameCellValues: number[][],
) => {
    for (let i = 0; i < gameCellValues.length; i += 1) {
        for (let j = 0; j < gameCellValues[i].length; j += 1) {
            if (gameCellValues[i][j] === 0) {
                return [i, j];
            }
        }
    }
    return null;
};

const checkValid = (
    position: number[],
    gameCellValues: number[][],
    inputNumber: number,
) => {
    const [row, column] = position;// 1, 7
    // console.log(row, column);
    for (let i = 0; i < 9; i += 1) {
        if (gameCellValues[row][i] === inputNumber && i !== column) {
            return false;
        }
    }
    for (let i = 0; i < 9; i += 1) {
        if (gameCellValues[i][column] === inputNumber && i !== row) {
            return false;
        }
    }
    const boxOfX = Math.floor(column / 3);
    const boxOfY = Math.floor(row / 3);
    // 1, 7
    for (let i = boxOfY * 3; i < boxOfY * 3 + 3; i += 1) {
        for (let j = boxOfX * 3; j < boxOfX * 3 + 3; j += 1) {
            if (gameCellValues[i][j] === inputNumber && i !== row && j !== column) {
                return false;
            }
        }
    }
    return true;
};

const printBoard = (
    gameCellsFormated: number[][],
) => {
    gameCellsFormated.forEach((row, rowIndex) => {
        row.forEach((column, columnIndex) => {
            process.stdout.write(` ${column}`);
            if (columnIndex % Math.sqrt(row.length) === 2) {
                process.stdout.write(' |');
            }
        });
        process.stdout.write('\n');
        if (rowIndex % Math.sqrt(row.length) === 2) {
            process.stdout.write('———————————————————————\n');
        }
    })
};

const solve = async (
    gameCellsFormated: number[][],
    gameCells: ElementHandle[],
    numPad: ElementHandle[],
) => {
        let emptyFound = findEmptyCell(gameCellsFormated);
        if (!emptyFound) {
            return true;
        }
        for (let i = 1; i <= 9; i += 1) {
            if (checkValid(emptyFound, gameCellsFormated, i)) {
                const [row, column] = emptyFound;
                await gameCells[row * 9 + column].click();
                await numPad[i - 1].click();
                gameCellsFormated[row][column] = i;
                if ((await solve(gameCellsFormated, gameCells, numPad))) {
                    // await gameCells[row * 9 + column].click();
                    // await numPad[i - 1].click();
                    return true;
                }
                gameCellsFormated[row][column] = 0;
            }
        }
        return false;
};

(async () => {
    const url = 'https://sudoku.com/';
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const pages = await browser.pages();
    const page = pages.length
        ? pages[0]
        : (await browser.newPage());
    await page.goto(url);
    await page.waitForSelector('.difficulty-menu-select');
    await page.select('.difficulty-menu-select', '/easy/');
    await sleep(2000);
    console.log('[Event]: Page loaded');
    const fontList = await page.evaluate(() => window.Font);
    const gameCells = await page.$$('.cell-value');
    const gameCellValues = await Promise.all(gameCells
        .map(async (gameCell) => (await gameCell.getProperty('innerHTML')).jsonValue() as Promise<string>));
    const gameCellsFormated = svgToValue(fontList, gameCellValues);
    const numPad = await page.$$('.numpad-item');
    printBoard(gameCellsFormated);
    await solve(gameCellsFormated, gameCells, numPad);
    printBoard(gameCellsFormated);
    // await browser.close();
})()