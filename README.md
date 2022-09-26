# Twitch Vod Timestamper

## Requirements
• [Cloudflare free tier account](https://dash.cloudflare.com/sign-up)
• [wrangler](https://developers.cloudflare.com/workers/cli-wrangler)
• [node](https://nodejs.org/) (recommend using [nvm](https://github.com/nvm-sh/nvm) to install)

## Setup
1. Clone this repository into a directory `git clone https://github.com/samerbam/twitch-timestamper`
2. Create twitch appliation here `https://dev.twitch.tv/console/apps/create` and note down the `client id` and `client secret`.
3. Create and write down your first `access token` and `refresh token` here `https://twitchtokengenerator.com`. The program will automatically refresh these after the inital tokens.
4. rename `wrangler.example.toml` to `wrangler.toml`
5. Create kv:namespace named tokens `wrangler kv:namespace create "tokens"`
6. Create preview kv:namespace named tokens `wrangler kv:namespace create --preview "NAMESPACE"`
7. Set `twitch_username` in `wrangler.toml` to the username of the twitch account you used to create the twitch application.
8. Set `twitch_parser_url` in `wrangler.toml` to the URL where [Twitch VOD Game Type Parser](https://github.com/samerbam/Twitch-VOD-Game-Type-Parser) is hosted.
9. Set the secret `clientID` to your client id which you got in step 2 `wrangler secret put clientID`
10. Set the secret `clientSecret` to your client secret which you got in step 2 `wrangler secret put clientSecret`
11. Install npm dependencies `npm install` (might need to manually copy the @twurple node_module in this repo back into the node_module folder after npm install)
11. Publish to your cloudflare subdomain with `wrangler publish` or run locally with `wrangler dev`

### Had to make small small change to @twurple library
#### NOTE: I recommend downloading the twurple library with npm and removing all instances of `@d-fischer/cross-fetch` manually, However, [this](https://github.com/samerbam/twitch-timestamper/tree/master/node_modules/%40twurple) is included for reference.
	* Removed all instances of `@d-fischer/cross-fetch` in @twurple
	* Included module here.

### Needs secondary program running on a server.
	https://github.com/samerbam/Twitch-VOD-Game-Type-Parser
