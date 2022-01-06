
const RELAY_API_URL = 'https://relay-api-33e56.ondigitalocean.app/api/gasPrices';

export function getGasPrices() {

    return fetch(RELAY_API_URL)
        .then(res => res.json())
        .catch(err => console.log(`err`, err))
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let gasPrices = {};

async function startUpdatingGasPrices() {
    while (true) {
        try {
            gasPrices = await getGasPrices();
            await sleep(60000);
        } catch (e) {
            console.log(`Error retrieving gasPrices from api: ${e}`);
            await sleep(4000);
        }
    }
}

startUpdatingGasPrices();

export default async function useGasPrice(chainId) {
    return gasPrices[chainId];
}
