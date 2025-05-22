import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add account association
    accountAssociation: {
        "header": "eyJmaWQiOjEwNzU0MzIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhBRWE4N0NkRTE0YkY0YTBFNjZkOTVjYjYyM0ZhNkQ5RmRiMjUxODc5In0",
        "payload": "eyJkb21haW4iOiJtb25hZGZyZW5zLmZ1biJ9",
        "signature": "MHhmOTAzYzk5MGJlYmFkMDhlMGU5YTk2YTFkZTFiOTQ2OWNkZTY4NTkwOTk5NGRmNzk1NjJkN2I0ZTJiNTQ2NjZkNmE2Y2MxOWE5NTcxYmUwOTMxMTNjNjNmN2U1ZGE1NTk2OWE4YjhjNTEwNDM3YmQyOWIwNWMzMDc5NDcyYzlmNTFi"
      },
    
    frame: {
      version: "1",
      name: "Monad Frens MiniApp",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "trading","connect"],
      primaryCategory: "developer-tools",
      buttonTitle: "WAGMI!",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
      
    },
  };

  return NextResponse.json(farcasterConfig);
}
