/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { FtrService } from '../ftr_provider_context';

export class UnifiedSearchPageObject extends FtrService {
  private readonly retry = this.ctx.getService('retry');
  private readonly testSubjects = this.ctx.getService('testSubjects');
  private readonly find = this.ctx.getService('find');
  private readonly comboBox = this.ctx.getService('comboBox');

  public async switchDataView(
    switchButtonSelector: string,
    dataViewTitle: string,
    transitionFromTextBasedLanguages?: boolean
  ) {
    await this.testSubjects.click(switchButtonSelector);

    const indexPatternSwitcher = await this.testSubjects.find('indexPattern-switcher', 500);
    await this.testSubjects.setValue('indexPattern-switcher--input', dataViewTitle);
    await (await indexPatternSwitcher.findByCssSelector(`[title="${dataViewTitle}"]`)).click();

    if (Boolean(transitionFromTextBasedLanguages)) {
      await this.testSubjects.click('unifiedSearch_switch_noSave');
    }

    await this.retry.waitFor(
      'wait for updating switcher',
      async () => (await this.getSelectedDataView(switchButtonSelector)) === dataViewTitle
    );
  }

  public async getSelectedDataView(switchButtonSelector: string) {
    let visibleText = '';

    await this.retry.waitFor('wait for updating switcher', async () => {
      visibleText = await this.testSubjects.getVisibleText(switchButtonSelector);
      return Boolean(visibleText);
    });

    return visibleText;
  }

  private async modifyDataView(buttonLocator: string) {
    await this.retry.waitForWithTimeout('data create new to be visible', 15000, async () => {
      return await this.testSubjects.isDisplayed(buttonLocator);
    });
    await this.testSubjects.click(buttonLocator);
    await this.retry.waitForWithTimeout(
      'index pattern editor form to be visible',
      15000,
      async () => {
        return await (await this.find.byClassName('indexPatternEditor__form')).isDisplayed();
      }
    );
    await (await this.find.byClassName('indexPatternEditor__form')).click();
  }

  public async clickCreateNewDataView() {
    await this.modifyDataView('dataview-create-new');
  }

  public async clickEditDataView() {
    await this.modifyDataView('indexPattern-manage-field');
  }

  public async createNewDataView(dataViewPattern: string, adHoc = false, hasTimeField = false) {
    await this.clickCreateNewDataView();
    await this.testSubjects.setValue('createIndexPatternTitleInput', dataViewPattern, {
      clearWithKeyboard: true,
      typeCharByChar: true,
    });
    await this.retry.waitFor('timestamp field loaded', async () => {
      const timestampField = await this.testSubjects.find('timestampField');
      return hasTimeField
        ? !(await timestampField.elementHasClass('euiComboBox-isDisabled'))
        : true;
    });
    await this.testSubjects.click(adHoc ? 'exploreIndexPatternButton' : 'saveIndexPatternButton');
  }

  public async editDataView(newPattern?: string, newTimeField?: string) {
    await this.clickEditDataView();
    if (newPattern) {
      await this.testSubjects.setValue('createIndexPatternTitleInput', newPattern, {
        clearWithKeyboard: true,
        typeCharByChar: true,
      });
    }
    if (newTimeField) {
      await this.comboBox.set('timestampField', newTimeField);
    }
    await this.testSubjects.click('saveIndexPatternButton');
    if (await this.testSubjects.exists('confirmModalConfirmButton')) {
      await this.testSubjects.click('confirmModalConfirmButton');
    }
  }

  public async isAdHocDataView() {
    const dataViewSwitcher = await this.testSubjects.find('discover-dataView-switch-link');
    const dataViewName = await dataViewSwitcher.getVisibleText();
    await dataViewSwitcher.click();
    return await this.testSubjects.exists(`dataViewItemTempBadge-${dataViewName}`);
  }

  public async selectTextBasedLanguage(language: string) {
    await this.find.clickByCssSelector(
      `[data-test-subj="text-based-languages-switcher"] [title="${language}"]`
    );
  }
}
