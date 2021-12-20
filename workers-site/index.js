import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';
import { ApiClient } from '@twurple/api';
import { RefreshingAuthProvider } from '@twurple/auth';
import { parse } from 'node-html-parser';
const util = require('util');

const DEBUG = false

addEventListener('fetch', event => {
      const url = new URL(event.request.url)
      if (event.request.method == "GET") {
        // Handle GET requests
          event.respondWith(handleGet(event))
      }
      else if(event.request.method === "POST") {
        // Handle POST requests
        event.respondWith(handlePost(event))
      }
      else {
        event.respondWith( new Response(null, {status: 405, statusText: "Method Not Allowed"}) )
      }
})

async function handlePost(event) {
    const tokenData = JSON.parse(await tokens.get("tokenData"));
    const authProvider = new RefreshingAuthProvider(
      {
        clientId,
        clientSecret,
        onRefresh: async newTokenData => await tokens.put('tokenData', JSON.stringify(newTokenData, null, 4))
      },
      tokenData
    );
    const apiClient = new ApiClient({ authProvider });
    const twitchVideoId = (await event.request.json()).vodLink
    const vidData = await apiClient.videos.getVideoById(twitchVideoId)

    const vodTimes = await fetch("https://"+ twitch_parser_url +"/twitch/" + twitchVideoId, {cf: {cacheTtl: 1800, cacheEverything: true}}).then(async function(response) {
      console.log('hmm')
        if (!response.ok) {
            console.log('error')
            return JSON.stringify({'error': 'Server Error'})
          }
          console.log('yay')
        return await gatherResponse(response);
      })

    const response = new Response(JSON.stringify({"vodName": vidData.title, "vodDate": vidData.creationDate, "vodTimes": vodTimes}), {headers: {}})

    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'unsafe-url')
    response.headers.set('Feature-Policy', 'none')

    return response
}

async function handleGet(event) {
  let options = {}

  try {
    if (DEBUG) {
      options.cacheControl = {
        bypassCache: true,
      }
    }

    const page = await getAssetFromKV(event, options)
    const response = new Response(page.body, page)

    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'unsafe-url')
    response.headers.set('Feature-Policy', 'none')

    return response

  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 })
  }
}

async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return JSON.stringify(await response.json())
  }
  else if (contentType.includes("application/text")) {
    return response.text()
  }
  else if (contentType.includes("text/html")) {
    return response.text()
  }
  else {
    return response.text()
  }
}
