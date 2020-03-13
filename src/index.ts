import puppeteer, { Page } from 'puppeteer';

declare global {
    interface Window {
        Font: any
    }
}

const svgToValue = (
    Font: any,
    gameCellValues: string[],
) => gameCellValues.map((gameCellValue) => {
    for (let i = 1; i <= 9; i += 1) {
        if (Font[i].slice(0, -8) === gameCellValue.slice(0, -14)) {
            return i;
        }
    }
    return 0;
});

const sliceToSudokuStyle = (gameTable: number[]) => Array
    .from({ length: 9 })
    .map((el, index) => gameTable.slice(index * 9, index * 9 + 9));

const fillCell = async (
    page: Page,
    cell: Element,
    answer: number,
) => {
    await page.$x('//*[@id="game-cell"][1]')
}
(async () => {
    const url = 'https://sudoku.com/';
    const browser = await puppeteer.launch({ headless: false });
    const pages = await browser.pages();
    const page = pages.length
        ? pages[0]
        : (await browser.newPage());
    await page.goto(url);
    await page.waitForSelector('.difficulty-menu-select');
    console.log('[Event]: Page loaded');
    // await page.evaluate(() => document.querySelector('.nav-worker_threads')!.scrollIntoView())
    const fontList = await page.evaluate(() => window.Font);
    const gameCellValues = await page
        .evaluate(() => [...document.querySelectorAll('.cell-value')].map((gameCell) => gameCell.innerHTML));
    const gameCellsFormated = svgToValue(fontList, gameCellValues);

    for(let i = 1; i <= 81; i += 1) {
        await page.waitFor(500);
        (await page.$x(`//*[@class="game-cell"][${i}]`))[0].click();
    }
    // await browser.close();
})()