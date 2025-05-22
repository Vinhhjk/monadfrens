function getCountbackForYear(resolution: string): number {
    const match = resolution.match(/^(\d+)([smhd])$/); // add 's' to the regex
    if (!match) throw new Error("Invalid resolution format");
    const value = parseInt(match[1], 10);
    const unit = match[2];
    let seconds = 0;
    if (unit === "s") seconds = value; // handle seconds
    else if (unit === "m") seconds = value * 60;
    else if (unit === "h") seconds = value * 3600;
    else if (unit === "d") seconds = value * 86400;
    else throw new Error("Unsupported unit");
    const secondsInYear = 365 * 24 * 60 * 60;
    return Math.floor(secondsInYear / seconds);
}
export async function fetchOHLCV(marketAddress: string, from: string, toCurrent: string, resolution:string = "5m", isUSDCPair: boolean = false): Promise<any> {
    const countback = getCountbackForYear(resolution);
    console.log("Countback:", countback); // Log the countback value for debugging
    const apiUrl = `https://api.kuru.io/api/v2/${marketAddress}/trades/history?countback=${countback}&from=${from}&to=${toCurrent}&resolution=${resolution}&isDollar=${!isUSDCPair}`;
    console.log("API URL:", apiUrl); // Log the API URL for debugging
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();
        return responseData.data;
    } catch (error) {
        console.error("Error fetching OHLCV data:", error);
        throw error;
    }
}


// async function callFetchOHLCV() {
//     const marketAddress = "0x277bf4a0aac16f19d7bf592feffc8d2d9a890508"; // Replace with the actual market address
//     const toCurrent = Math.floor(Date.now() / 1000); // Current time in Unix timestamp
//     const from = Math.floor(new Date().setFullYear(new Date().getFullYear() - 1) / 1000); // 1 year ago in Unix timestamp

//     try {
//         const ohlcvData = await fetchOHLCV(marketAddress, from.toString(), toCurrent.toString());
//         console.log("Fetched OHLCV Data:", ohlcvData);
//     } catch (error) {
//         console.error("Error calling fetchOHLCV:", error);
//     }
// }

// callFetchOHLCV();