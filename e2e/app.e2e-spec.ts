import { HomeMoneyPage } from './app.po';

describe('home-money App', () => {
  let page: HomeMoneyPage;

  beforeEach(() => {
    page = new HomeMoneyPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('wfm works!');
  });
});
