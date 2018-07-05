
var t = require('assert')


module.exports = ({popup, advanced, content}) => {

  before(async () => {
    // popup
    await popup.bringToFront()
    // defaults button
    await popup.click('button:nth-of-type(2)')

    // advanced
    await advanced.bringToFront()

    // remove origin
    if (await advanced.evaluate(() => Object.keys(state.origins).length > 1)) {
      // expand origin
      if (!await advanced.evaluate(() => document.querySelector('.m-list li:nth-of-type(2)').classList.contains('m-expanded'))) {
        await advanced.click('.m-list li:nth-of-type(2)')
      }
      await advanced.click('.m-list li:nth-of-type(2) .m-footer .m-button')
    }

    // add origin
    await advanced.select('.m-select', 'http')
    await advanced.type('[type=text]', 'localhost:3000')
    await advanced.click('button')
    await advanced.waitFor(200)

    // expand origin
    if (!await advanced.evaluate(() => document.querySelector('.m-list li:nth-of-type(2)').classList.contains('m-expanded'))) {
      await advanced.click('.m-list li:nth-of-type(2)')
    }

    // enable header detection
    if (!await advanced.evaluate(() => state.header)) {
      await advanced.click('.m-switch')
    }

    // enable path matching
    await advanced.evaluate(() => {
      document.querySelector('.m-list li:nth-of-type(2) input').value = 'encoding-.*'
      document.querySelector('.m-list li:nth-of-type(2) input').dispatchEvent(new Event('keyup'))
    })
    // there is debounce timeout of 750ms in the options UI
    await advanced.waitFor(800)
  })

  describe('no content-type header set', () => {
    before(async () => {
      // set wrong encoding
      await advanced.select('.m-list li:nth-of-type(2) .m-encoding select', 'Shift_JIS')

      // go to page serving Big5 encoded string
      // with no content-type header set
      await content.goto('http://localhost:3000/encoding-no-content-type')
      await content.bringToFront()
      await content.waitFor(200)
    })
    it('do not override if content-type header is missing', async () => {
      t.equal(
        await content.evaluate(() => document.charset),
        'Big5',
        'chrome detects the correct encoding automatically'
      )
      t.equal(
        await content.evaluate(() => document.querySelector('#_html p').innerText),
        '你好',
        'text should be decoded correctly'
      )
    })
  })

  describe('no charset in content-type header', () => {
    before(async () => {
      // set wrong encoding
      await advanced.select('.m-list li:nth-of-type(2) .m-encoding select', 'Shift_JIS')

      // go to page serving Big5 encoded string
      // with no charset set in the content-type header
      await content.goto('http://localhost:3000/encoding-no-charset')
      await content.bringToFront()
      await content.waitFor(200)
    })
    it('do not override if charset is missing in content-type header', async () => {
      t.equal(
        await content.evaluate(() => document.charset),
        'Big5',
        'chrome detects the correct encoding automatically'
      )
      t.equal(
        await content.evaluate(() => document.querySelector('#_html p').innerText),
        '你好',
        'text should be decoded correctly'
      )
    })
  })

  describe('wrong charset in content-type header', () => {
    before(async () => {
      // detect encoding automatically
      await advanced.select('.m-list li:nth-of-type(2) .m-encoding select', '')

      // go to page serving windows-1251 encoded string
      // with UTF-8 charset set in content-type header
      await content.goto('http://localhost:3000/encoding-wrong-charset')
      await content.bringToFront()
      await content.waitFor(200)
    })
    it('when encoding override is disabled', async () => {
      t.equal(
        await content.evaluate(() => document.charset),
        'UTF-8',
        'chrome picks the wrong encoding from the content-type charset'
      )
      t.equal(
        await content.evaluate(() => document.querySelector('#_html p').innerText),
        '�������',
        'text should be decoded incorrectly'
      )
    })
  })

  describe('override charset set in content-type header', () => {
    before(async () => {
      await advanced.bringToFront()

      // override encoding
      await advanced.select('.m-list li:nth-of-type(2) .m-encoding select', 'Windows-1251')

      // go to page serving windows-1251 encoded string
      // with UTF-8 charset set in content-type header
      await content.goto('http://localhost:3000/encoding-wrong-charset')
      await content.bringToFront()
      await content.waitFor(200)
    })
    it('use encoding set for the origin', async () => {
      t.equal(
        await content.evaluate(() => document.charset),
        'windows-1251',
        'the content-type charset should be overridden'
      )
      t.equal(
        await content.evaluate(() => document.querySelector('#_html p').innerText),
        'здрасти',
        'text should be decoded correctly'
      )
    })
  })

  describe('persist state', () => {
    before(async () => {
      await advanced.bringToFront()
      await advanced.reload()
      await advanced.waitFor(200)
      // expand origin
      await advanced.click('.m-list li:nth-of-type(2)')
    })
    it('reload', async () => {
      t.equal(
        await advanced.evaluate(() =>
          document.querySelector('.m-list li:nth-of-type(2) .m-encoding select').value
        ),
        'Windows-1251',
        'should persist the selected encoding'
      )
    })
  })

}