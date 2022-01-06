const RELAY_API_URL = 'https://relay-api-33e56.ondigitalocean.app/api/crosschain-config';

export function useCrossChainConfig() {

    return fetch(RELAY_API_URL)
        .then(res => res.json())
        .catch(err => console.log(`err`, err))
}