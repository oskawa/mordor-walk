import axios from "axios";

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const WORDPRESS_REST_ENDPOINT = process.env.WORDPRESS_REST_ENDPOINT;

export async function POST(req, res) {

    try {
        const { code, userId, token } = await req.json();

        if (!token || !userId) {
            return new Response(
                JSON.stringify({ error: "User ID or token is missing." }),
                { status: 400 }
            );
        }

        if (!code) {
            return new Response(
                JSON.stringify({ error: "Authorization code not provided." }),
                { status: 400 }
            );
        }



        // Step 1: Exchange authorization code for tokens
        const tokenResponse = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
        });


        const { access_token, refresh_token, athlete } = tokenResponse.data;
       

        // Step 2: Send data to WordPress
        const wordpressResponse = await axios.post(
            `${WORDPRESS_REST_ENDPOINT}?userId=${userId}`, // Add userId as a query parameter
            {
                access_token,
                refresh_token,
                athlete,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`, // Add the Bearer Token in the Authorization header
                },
            }
        );


        if (wordpressResponse.status === 200) {
            return new Response(JSON.stringify({ message: "Strava data saved successfully." }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: "Failed to save data to WordPress." }), { status: 500 });
        }
    } catch (error) {
        console.error("Error in Strava callback handler:", error.response?.data || error.message || error);
        return new Response(JSON.stringify({ error: "Failed to handle Strava callback." }), { status: 500 });
    }
}
