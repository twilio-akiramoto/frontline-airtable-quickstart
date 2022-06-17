exports.handler = async (context, event, callback) => {
  const { AnalyticsBrowser } = require('@segment/analytics-next')
  const analytics = AnalyticsBrowser.load({ writeKey: context.SEGMENT_WRITE_KEY })
  analytics.identify({
    userId: '1000',
    traits: {
      name: 'John Smith',
      phone: '+19998887777',
      email: 'johnsmith@email.com'
    }
  })
  analytics.flush()
  const customerNumber = '+19998887777'
  const MessageBody = 'I want to purchase and close this deal this week. Send me the contract, the finance. I have decided'

  const keyWords = [
    {
      name: 'close',
      value: 9
    },
    {
      name: 'buy',
      value: 8
    },
    {
      name: 'finance',
      value: 5
    },
    {
      name: 'purchase',
      value: 7
    },
    {
      name: 'contract',
      value: 2.5
    },
    {
      name: 'buying',
      value: 4
    },
    {
      name: 'opportunity',
      value: 3.5
    },
    {
      name: 'interest',
      value: 3
    },
    {
      name: 'decided',
      value: 7.5
    },
    {
      name: 'money',
      value: 4.5
    },
    {
      name: 'ready',
      value: 8
    },
    {
      name: 'deal',
      value: 8
    },
    {
      name: 'interested',
      value: 8
    }
  ]

  checkForKeyWord(MessageBody, keyWords, customerNumber)
  async function checkForKeyWord (message, word, phone) {
    let count = 0
    for (let i = 0; i < word.length; i++) {
      if (message.indexOf(word[i].name) > -1) {
      // eslint-disable-next-line no-unused-vars
        ++count
        const msg = 'keyword ' + word[i].name + ' is in string'
        console.log(msg)
        console.log(word[i].name + ': ' + word[i].value)
        const sendToSegment = {
          phone: phone,
          keyword: word[i].name,
          value: word[i].value
        }
        console.log('Send to Segment: ', sendToSegment)
        const axios = require('axios')
        await axios.post(context.SEGMENT_SOURCE_KEYWORD_DETECTED, sendToSegment)
          .then((res) => {
            console.log('Status: ', res.status)
            console.log('Body: ', res.data)
          }).catch((err) => {
            console.error(err)
          })
      }
    }
  }
}
