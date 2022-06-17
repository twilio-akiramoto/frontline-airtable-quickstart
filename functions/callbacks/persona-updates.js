exports.handler = async (context, event, callback) => {
  console.log('Persona Update: ', event)

  // Function to send SMS notification to FRONTLINE_OWNER_NUMBER
  const sendSMSNotification = async (message) => {
    const accountSid = context.ACCOUNT_SID
    const authToken = context.AUTH_TOKEN
    const client = require('twilio')(accountSid, authToken)
    client.messages
      .create({ body: message, from: context.TWILIO_SMS_NUMBER, to: context.FRONTLINE_OWNER_NUMBER })
      .then(message => console.log(message.sid))
  }
  //
  const Airtable = require('airtable')
  const base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(context.AIRTABLE_BASE_ID)
  const filterFieldValue = event.userId
  const eventType = event.type

  const updateAirtable = async (base, filterFieldValue, updateObj) => {
    const filterFieldName = 'id'
    await base('Customers').select({
      maxRecords: 1,
      filterByFormula: '({' + filterFieldName + "} = '" + filterFieldValue + "')"
    }).firstPage(function (err, records) {
      if (err) {
        console.log(err)
      }
      if (records.length > 0) {
        const r = records[0].fields
        r.id = records[0].id // Find the right Airtable ID
        console.log(r.id)
        const customerName = r.name
        console.log(customerName)
        base('Customers').update([
          {
            id: r.id,
            fields: {
              notes: updateObj
            }
          }
        ], function (err, records) {
          if (err) {
            console.error(err)
            return
          }
          records.forEach(function (record) {
            console.log(record.get('notes'))
          })
        })
        // Notify about status change
        console.log('success to update records for userId', filterFieldValue, 'note = ', updateObj)
        const message = 'Readiness to buy status changed to High for ' + customerName
        sendSMSNotification(message)
      }
    }
    )
  }
  //
  switch (eventType) {
    case 'identify': {
      console.log('detected identify')
      const booleanValue = event.traits.buyer_readiness_high
      console.log('Audience Buyer Readiness High', booleanValue)
      if (booleanValue) {
        const updateObj = 'Buyer Readiness High'
        console.log(updateObj)
        console.log(filterFieldValue)
        updateAirtable(base, filterFieldValue, updateObj)
        sendSMSNotification()
      }
      const numericalValue = event.traits.sum_values
      console.log('trait Sum Values', numericalValue)
      if (numericalValue > 20) {
        const updateObj = 'Buyer Readiness High - Value: ' + numericalValue
        console.log(updateObj)
        console.log(filterFieldValue)
        updateAirtable(base, filterFieldValue, updateObj)
      }
      break
    }
    case 'track': {
      console.log('detected track')
      const booleanValue = event.properties.buyer_readiness_high
      console.log('Audience Buyer Readiness High', booleanValue)
      if (booleanValue) {
        const updateObj = 'Buyer Readiness High'
        console.log(updateObj)
        console.log(filterFieldValue)
        updateAirtable(base, filterFieldValue, updateObj)
      }
      const numericalValue = event.properties.sum_values
      if (numericalValue > 20) {
        const updateObj = 'Buyer Readiness High - Value: ' + numericalValue
        console.log(updateObj)
        console.log(filterFieldValue)
        updateAirtable(base, filterFieldValue, updateObj)
      }
      break
    }
    default: {
      console.log('Unknown eventType: ', eventType)
      callback(new Error(`422 Unknown eventType: ${eventType}`))
    }
  }
//   switch (eventType) {
//     case 'identify': {
//       // const updateObj = JSON.stringify(event.traits)
//       console.log('detected identify')
//       const booleanValue = event.traits.track_value_above_10
//       console.log('Audience Track Value Above 10', booleanValue)
//       if (booleanValue) {
//         const updateObj = 'Buyer Readiness High'
//         console.log(updateObj)
//         console.log(filterFieldValue)
//         updateAirtable(base, filterFieldValue, updateObj)
//       }
//       const numericalValue = event.traits.word_detection_sum
//       console.log('Audience word_detection_sum', numericalValue)
//       if (numericalValue > 20) {
//         const updateObj = 'Buyer Readiness High - Value: ' + numericalValue
//         console.log(updateObj)
//         console.log(filterFieldValue)
//         updateAirtable(base, filterFieldValue, updateObj)
//       }
//       break
//     }
//     case 'track': {
//       console.log('detected track')
//       const booleanValue = event.properties.users_two_messages_with_close
//       console.log('Audience two messages with close', booleanValue)
//       if (booleanValue) {
//         const updateObj = 'Buyer Readiness High - 2 close messages'
//         console.log(updateObj)
//         console.log(filterFieldValue)
//         updateAirtable(base, filterFieldValue, updateObj)
//       }
//       const numericalValue = event.properties.word_detection_sum
//       if (numericalValue > 20) {
//         const updateObj = 'Buyer Readiness High - Value: ' + numericalValue
//         console.log(updateObj)
//         console.log(filterFieldValue)
//         updateAirtable(base, filterFieldValue, updateObj)
//       }
//       break
//     }
//     default: {
//       console.log('Unknown eventType: ', eventType)
//       callback(new Error(`422 Unknown eventType: ${eventType}`))
//     }
//   }
}
// https://segment.com/docs/personas/using-personas-data/#computed-trait-generated-events
