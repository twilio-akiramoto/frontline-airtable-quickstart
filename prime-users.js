exports.handler = async (context, event, callback) => {
  const axios = require('axios')

  // const { AnalyticsBrowser } = require('@segment/analytics-next')
  // const analytics = AnalyticsBrowser.load({ writeKey: context.SEGMENT_WRITE_KEY })

  const Analytics = require('analytics-node-serverless')
  const analytics = new Analytics(context.SEGMENT_WRITE_KEY)

  const url = context.FRONTLINE_CRM_LINK

  const data = {
    Location: 'GetCustomersList',
    Worker: context.FRONTLINE_OWNER,
    Pagesize: '30'
  }
  const loadUsers = async (url, data) => {
    try {
      const res = await axios.post(url, data)
      console.log(`Status: ${res.status}`)
      console.log(data)
      const loadUsers = res.data.objects.customers
      console.log(loadUsers)
      const count = Object.keys(res.data.objects.customers).length
      console.log('There are ', count, 'customers')
      getPhoneForEachCustomer(loadUsers, count)
      function getPhoneForEachCustomer (loadUsers, count) {
        for (let i = 0; i < count; i++) {
          const dataCustomerDetail = {
            Location: 'GetCustomerDetailsByCustomerId',
            Worker: context.FRONTLINE_OWNER,
            CustomerId: loadUsers[i].customer_id
          }
          console.log(dataCustomerDetail)
          axios.post(url, dataCustomerDetail)
            .then(function (response) {
              const customerNumber = response.data.objects.customer.channels[0].value
              const displayName = response.data.objects.customer.display_name
              const customerId = response.data.objects.customer.customer_id
              const customerEmail = response.data.objects.customer.links.find((links) => links.type === 'Email').value || ''
              console.log(customerId, displayName, customerNumber, customerEmail)
              const segment = async (customerId, displayName, customerNumber, customerEmail) => {
                console.log('Running segment update for ', displayName)
                analytics.identify('1', {
                  // traits: {
                  //   name: 'Joe Clair',
                  //   phone: '+14697348516',
                  //   email: 'joeclair@email.com'
                  // }
                // analytics.identify(`${customerId}`, {
                //   traits: {
                //     name: displayName,
                //     phone: customerNumber,
                //     email: customerEmail
                //   }
                  // userId: '1',
                  // traits: {
                  //   name: 'Joe Clair',
                  //   phone: '+14697348516',
                  //   email: 'joeclair@email.com'
                  // }
                })
              }
              segment(customerId, displayName, customerNumber, customerEmail)
            })
            .catch(function (error) {
              console.log(error)
            })
        }
      }
      return (res.data.objects.customers)
    } catch (err) {
      console.error(err)
    }
    await analytics.flush()
    callback(null)
  }
  loadUsers(url, data)
}
