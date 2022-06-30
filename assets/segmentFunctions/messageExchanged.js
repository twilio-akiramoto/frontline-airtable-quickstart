// Learn more about source functions API at
// https://segment.com/docs/connections/sources/source-functions

/**
 * Handle incoming HTTP request
 *
 * @param  {FunctionRequest} request
 * @param  {FunctionSettings} settings
 */
 async function onRequest(request, settings) {
	// Get request body
	const body = request.json();

	// Grab user's phone number from the Twilio webhook
	const phone = body.phone;
	const message = body.message;
	const conversationsid = body.conversationsid;

	// Send Segment event

	Segment.track({
		event: 'Frontline Message Exchanged',
		anonymousId: phone,
		properties: {
			phone: phone,
			channel: 'Twilio Frontline',
			message: message,
			conversationsid: conversationsid
		}
	});
}