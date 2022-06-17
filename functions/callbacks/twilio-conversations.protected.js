// eslint-disable-next-line no-undef
const path = Runtime.getAssets()['/providers/customers.js'].path
const { getCustomerByNumber } = require(path)

exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient()

  const eventType = event.EventType
  console.log(`Received a webhook event from Twilio Conversations: ${eventType}`)

  switch (eventType) {
    case 'onConversationAdd': {
      /* PRE-WEBHOOK
             *
             * This webhook will be called before creating a conversation.
             *
             * It is required especially if Frontline Inbound Routing is enabled
             * so that when the worker will be added to the conversation, they will
             * see the friendly_name and avatar of the conversation.
             *
             * More info about the `onConversationAdd` webhook: https://www.twilio.com/docs/conversations/conversations-webhooks#onconversationadd
             * More info about handling incoming conversations: https://www.twilio.com/docs/frontline/handle-incoming-conversations
             */

      console.log('Setting conversation properties.')

      const customerNumber = event['MessagingBinding.Address']
      const isIncomingConversation = !!customerNumber

      if (isIncomingConversation) {
        try {
          const customerDetails = await getCustomerByNumber(context, customerNumber) || {}

          const conversationProperties = {
            friendly_name: customerDetails.display_name || customerNumber,
            attributes: JSON.stringify({
              avatar: customerDetails.avatar
            })
          }

          callback(null, conversationProperties)
        } catch (err) {
          callback(err)
        }
      }
      break
    }
    case 'onParticipantAdded': {
      /* POST-WEBHOOK
             *
             * This webhook will be called when a participant added to a conversation
             * including customer in which we are interested in.
             *
             * It is required to add customer_id information to participant and
             * optionally the display_name and avatar.
             *
             * More info about the `onParticipantAdded` webhook: https://www.twilio.com/docs/conversations/conversations-webhooks#onparticipantadded
             * More info about the customer_id: https://www.twilio.com/docs/frontline/my-customers#customer-id
             * And more here you can see all the properties of a participant which you can set: https://www.twilio.com/docs/frontline/data-transfer-objects#participant
             */

      const conversationSid = event.ConversationSid
      const participantSid = event.ParticipantSid
      const customerNumber = event['MessagingBinding.Address']
      const isCustomer = customerNumber && !event.Identity

      console.log(`Getting participant properties for ${customerNumber || event.Identity}`)

      if (isCustomer) {
        try {
          const customerParticipant = await client.conversations
            .conversations(conversationSid)
            .participants
            .get(participantSid)
            .fetch()

          const customerDetails = await getCustomerByNumber(context, customerNumber) || {}
          await setCustomerParticipantProperties(customerParticipant, customerDetails)
          callback(null, 'success')
        } catch (err) {
          callback(err)
        }
      }

      break
    }
    case 'onMessageAdd': {
      /* PRE-WEBHOOK
             * This webhook will be called when a message added to a conversation
             * More info about the `onParticipantAdded` webhook: https://www.twilio.com/docs/conversations/conversations-webhooks#onconversationadd
             */
      const customerNumber = event.Author
      const MessageBody = event.Body
      const ConversationSID = event.ConversationSid
      const axios = require('axios')
      console.log(JSON.stringify(event))
      console.log('Customer is:', customerNumber)
      console.log('Message body is:', MessageBody)
      console.log('ConversationSID is:', ConversationSID)
      /* SALES WORDS DETECTION
      * Detecting sales keywords on the conversations
      */
      const keyWords = [
        {
          name: 'close',
          value: 9
        },
        {
          name: 'deal',
          value: 4
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
          value: 6
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
          name: 'hot',
          value: 8
        },
        {
          name: 'interested',
          value: 2
        }
      ]
      checkForKeyWord(MessageBody, keyWords, customerNumber)
      function checkForKeyWord (message, word, phone) {
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
            const createNotification = async (sendToSegment) => {
              try {
                const res = await axios.post(context.SEGMENT_SOURCE_KEYWORD_DETECTED, sendToSegment)
                console.log(`Status: ${res.status}`)
                console.log(sendToSegment)
              } catch (err) {
                console.error(err)
              }
            }
            createNotification(sendToSegment)
          }
        }
      }
      //
      const sendMessageToSegment = {
        phone: customerNumber,
        message: MessageBody,
        conversationsid: ConversationSID
      }
      await axios.post(context.SEGMENT_SOURCE_MESSAGES_EXCHANGED, sendMessageToSegment)
        .then((res) => {
          console.log('Status: ', res.status)
          console.log('Body: ', res.data)
        }).catch((err) => {
          console.error(err)
        })
      //
      function delay (time) {
        return new Promise(resolve => setTimeout(resolve, time))
      }
      delay(3000).then(() => console.log('3 seconds passed'))
      //
      callback(null, { body: MessageBody })
      break
    }
  }
}

const setCustomerParticipantProperties = async (customerParticipant, customerDetails) => {
  const participantAttributes = JSON.parse(customerParticipant.attributes)
  const customerProperties = {
    attributes: JSON.stringify({
      ...participantAttributes,
      avatar: participantAttributes.avatar || customerDetails.avatar,
      customer_id: participantAttributes.customer_id || customerDetails.customer_id,
      display_name: participantAttributes.display_name || customerDetails.display_name
    })
  }

  // If there is difference, update participant
  if (customerParticipant.attributes !== customerProperties.attributes) {
    // Update attributes of customer to include customer_id
    await customerParticipant
      .update(customerProperties)
      .catch(e => console.log('Update customer participant failed: ', e))
  }
}
