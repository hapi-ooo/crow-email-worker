const sendEmail = async (data, env) => {
  return await fetch(env.POSTMARK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": env.POSTMARK_API_TOKEN,
    },
    body: JSON.stringify({
      From: "contact@crow-software.com",
      To: "hazel@crow-software.com",
      Subject: `Quote Requested by ${data.firstName} ${data.lastName}`,
      HtmlBody: `
			<p>First Name: ${data.firstName}</p>
			<p>Last Name: ${data.lastName}</p>
			<p>Email: ${data.email}</p>
			<p>Message: ${data.message}</p>
			`,
    }),
  });
}

const extractFormData = (body) => {
	let data = {
		firstName: null,
		lastName: null,
		email: null,
		message: null
	}
	body.data.forEach(field => {
		switch (field.key) {
			case 'first-name':
				data.firstName = field.value;
				return;
			case 'last-name':
				data.lastName = field.value;
				return;
			case 'email':
				data.email = field.value;
				return;
			case 'message':
				data.message = field.value;
				return;
			default:
				return;
		}
	});
	return data;
}

export default {
  async fetch(request, env, ctx) {
		const origin = request.headers.get('origin');
		if (!origin) {
			return new Response('Bad request', {status: 400});
		}

		const { success } = await env.emailRateLimit.limit({ key: origin });
		if (!success) {
			return new Response('You are timed out.', {status: 408});
		}

		if (request.method === "POST") {
			const body = await request.json();
			const data = extractFormData(body);
			let res = await sendEmail(data, env);
			res = new Response(res.body, { status: res.status });
			res.headers.set("Access-control-Allow-Origin", "*");
			res.headers.set("Access-control-Allow-Headers", "Content-Type");
			return res;
		}
		if (request.method === "OPTIONS") {
			let res = new Response('ok');
			res.headers.set("Access-control-Allow-Origin", "*");
			res.headers.set("Access-control-Allow-Headers", "Content-Type");
			return res;
		}
		return new Response("Method not allowed", { status: 405 });
  },
};