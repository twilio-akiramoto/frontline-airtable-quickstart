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
	const keyword = body.keyword;
	const value = body.value;

	const props = {
		phone: phone,
		keyword: keyword,
		value: value
	};

	// Send Segment event

	Segment.track({
		event: 'Detected Keyword',
		anonymousId: phone,
		properties: props,
		context: [
			{
				id: phone,
				type: 'phone',
				channel: 'Twilio Frontline'
			}
		]
	});
}