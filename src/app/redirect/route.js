export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code) {
        // Redirect to your profile page with the Strava code
        return new Response(null, {
            status: 302,
            headers: {
                Location: `/profile?stravaCallback=true&code=${code}&state=${state || ""}`,
            },
        });
    }

    // If no code is present, show an error or redirect
    return new Response("Missing authorization code.", { status: 400 });
}
