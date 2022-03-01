const path = Runtime.getAssets()['/providers/customers.js'].path
const { getCustomerById } = require(path);

exports.handler = async function(context, event, callback) {
    try {
        console.log(event);
        const location = event.Location;
    
        // Location helps to determine which information was requested.
        // CRM callback is a general purpose tool and might be used to fetch different kind of information
        switch (location) {
            case 'GetTemplatesByCustomerId': {
                try {
                    const resp = await handleGetTemplatesByCustomerIdCallback(context, event);
                    callback(null, resp);
                } catch(err) {
                    console.log(err);
                    callback(err);
                }
                
                break;
            }
    
            default: {
                callback(422, `Unknown location: location`)
            }
        }
    } catch(err) {
        console.log(err);
        callback(err);
    }
};

const handleGetTemplatesByCustomerIdCallback = async (context, event) => {
    console.log('Getting templates: ', event.CustomerId);

    const customerDetails = await getCustomerById(context, event.CustomerId);

    if (!customerDetails) {
        throw new Error('Customer not found');
    }

    // Prepare templates categories
    const openersCategory = {
        display_name: 'Openers', // Category name
        templates: [
            { content: compileTemplate(OPENER_NEXT_STEPS, customerDetails) }, // Compiled template
            { content: compileTemplate(OPENER_NEW_PRODUCT, customerDetails) },
            { content: compileTemplate(OPENER_ON_MY_WAY, customerDetails), whatsAppApproved: true },
        ]
    };
    const repliesCategory = {
        display_name: 'Replies',
        templates: [
            { content: compileTemplate(REPLY_SENT, customerDetails) },
            { content: compileTemplate(REPLY_RATES, customerDetails) },
            { content: compileTemplate(REPLY_OMW, customerDetails) },
            { content: compileTemplate(REPLY_OPTIONS, customerDetails) },
            { content: compileTemplate(REPLY_ASK_DOCUMENTS, customerDetails) },
        ]
    };
    const closingCategory = {
        display_name: 'Closing',
        templates: [
            { content: compileTemplate(CLOSING_ASK_REVIEW, customerDetails) },
        ]
    };

    // Respond with compiled Templates
    return [openersCategory, repliesCategory, closingCategory];
};

const compileTemplate = (template, customer) => {
    let compiledTemplate = template.replace(/{{Name}}/, customer.display_name);
    compiledTemplate = compiledTemplate.replace(/{{Author}}/, customer.worker);
    return compiledTemplate;
};

const OPENER_NEXT_STEPS = 'Hello {{Name}} we have now processed your documents and would like to move you on to the next step. Drop me a message. {{Author}}.';
const OPENER_NEW_PRODUCT = 'Hello {{Name}} we have a new product out which may be of interest to your business. Drop me a message. {{Author}}.';
const OPENER_ON_MY_WAY ='Just to confirm I am on my way to your office. {{Name}}.';

const REPLY_SENT = 'This has now been sent. {{Author}}.';
const REPLY_RATES = 'Our rates for any loan are 20% or 30% over $30,000. You can read more at https://example.com. {{Author}}.';
const REPLY_OMW = 'Just to confirm I am on my way to your office. {{Author}}.';
const REPLY_OPTIONS = 'Would you like me to go over some options with you {{Name}}? {{Author}}.';
const REPLY_ASK_DOCUMENTS = 'We have a secure drop box for documents. Can you attach and upload them here: https://example.com. {{Author}}';

const CLOSING_ASK_REVIEW = 'Happy to help, {{Name}}. If you have a moment could you leave a review about our interaction at this link: https://example.com. {{Author}}.';