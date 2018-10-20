import { browser, element, by } from 'protractor';

export class HomeMoneyPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('wfm-root h1')).getText();
  }
}
