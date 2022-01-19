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

addEventListener("scheduled", event => {
    event.waitUntil(handleScheduled(event))
// addEventListener("fetch", event => {
  // event.respondWith(handleScheduled(event))
})

async function handleScheduled(event) {
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

  const res = await apiClient.videos.getVideosByUser(await apiClient.users.getUserByName("x33n"))
  for await (const vid of res.data) {
    console.log(vid.id + ": ")
    let currentVid = await tokens.get(vid.id.toString())
    if (currentVid === null) {
      await fetch("https://"+ twitch_parser_url +"/twitch/" + vid.id, {cf: {cacheTtl: 1800, cacheEverything: true}}).then(async function(response) {
        console.log('fetched.')
          if (!response.ok) {
              console.log('error')
              // tokens.put(vid.id.toString(), JSON.stringify({'error': 'Server Error'}), {expirationTtl: 86400})
              tokens.put(vid.id.toString(), JSON.stringify({"vodName": vid.title, "vodDate": vid.creationDate, "vodTimes": JSON.stringify({'error': 'Server Error'})}), {expirationTtl: 86400})
              return;
            }
            console.log('yay')
            console.log('=')
          let gRes = await gatherResponse(response);
          await tokens.put(vid.id.toString(), JSON.stringify({"vodName": vid.title, "vodDate": vid.creationDate, "vodTimes": gRes}));
          return;
        })
    }
  }
  return new Response(200, {'status': 200})
}

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


    let responseJson = ""
    const cachedValue = await tokens.get(twitchVideoId.toString())
    if (cachedValue === null) {
      const vidData = await apiClient.videos.getVideoById(twitchVideoId)
      responseJson = await fetch("https://"+ twitch_parser_url +"/twitch/" + twitchVideoId, {cf: {cacheTtl: 1800, cacheEverything: true}}).then(async function(response) {
        console.log('hmm')
          if (!response.ok) {
              console.log('error')
              tokens.put(twitchVideoId.toString(), JSON.stringify({"vodName": vidData.title, "vodDate": vidData.creationDate, "vodTimes": JSON.stringify({'error': 'Server Error'})}), {expirationTtl: 86400})
              return JSON.stringify({"vodName": vidData.title, "vodDate": vidData.creationDate, "vodTimes": JSON.stringify({'error': 'Server Error'})});
            }
            console.log('yay')
          let gRes = await gatherResponse(response);
          await tokens.put(twitchVideoId.toString(), JSON.stringify({"vodName": vidData.title, "vodDate": vidData.creationDate, "vodTimes": gRes}));
          return JSON.stringify({"vodName": vidData.title, "vodDate": vidData.creationDate, "vodTimes": gRes});
        })
    } else {
      responseJson = cachedValue
    }

    const response = new Response(responseJson, {headers: {}})

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
