import axios from 'axios';
export class ItemService {
    private gw2ApiUrl = 'https://api.guildwars2.com/v2';
    private gw2Spidy = 'http://www.gw2spidy.com/api/v0.9/json';
    private gw2Shinies = 'https://www.gw2shinies.com/api/json/';
    private MAX_SIMULTANEOUS_DOWNLOADS = 20;
    private itemsPerRequest = 200;

    getItemListingIds() {
        return axios.get(`${this.gw2ApiUrl}/commerce/listings`)
            .then(response => response.data);
    }

    getListings(ids: number[]) {
        return axios.get(`${this.gw2ApiUrl}/commerce/listings?ids=${ids}`)
            .then(response => response.data)
    }

    getItems(itemIds: number[]) {
        return axios.get(`${this.gw2ApiUrl}/items?ids=${itemIds}`)
            .then(response => response.data)
    }
}