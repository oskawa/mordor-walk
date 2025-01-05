const StravaConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT; // Only the domain

    const handleConnect = () => {
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=read,activity:read`;
        window.location.href = authUrl;
    };

    return <button className="btn-strava" onClick={handleConnect}><img src="./images/btn-strava.png" alt="" /></button>;
};

export default StravaConnect;
