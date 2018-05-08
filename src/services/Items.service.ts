import axios from "axios";
import { fork } from "child_process";
import app from "../app";

export class ItemService {
    private gw2ApiUrl = "https://api.guildwars2.com/v2";
    private gw2Spidy = "http://www.gw2spidy.com/api/v0.9/json";
    private gw2Shinies = "https://www.gw2shinies.com/api/json/";
    private BATCH_SIZE = 200;

    private listingsQueue: Array<any>;
    private batches: any[];


    getItemListingIds() {
        return axios.get(`${this.gw2ApiUrl}/commerce/listings`)
            .then(response => response.data);
    }

    getListings(ids: number[]) {
        return axios.get(`${this.gw2ApiUrl}/commerce/listings?ids=${ids}`)
            .then(response => response.data);
    }

    getItems(itemIds: number[]) {
        return axios.get(`${this.gw2ApiUrl}/items?ids=${itemIds}`)
            .then(response => response.data);
    }

    async importItemListings() {
        // Get all the item listings
        return this.getItemListingIds().then(listingIds => {
            // split up the items into batches
            const batches = this.batchItems(listingIds, this.BATCH_SIZE);

            // run queue worker on batches
            this.startQueueWorker(batches);

        });
    }
    batchItems(arr: any[], size: number): any[] {
        const batches: any[] = [];

        if (size <= 0) {
            return batches;
        }

        for (let index = 0; index < arr.length; index++) {
            const currentBatchIndex = Math.floor(index / size);
            if (!batches[currentBatchIndex]) {
                batches[currentBatchIndex] = [];
            }
            batches[currentBatchIndex].push(arr[index]);
        }
        return batches;
    }

    async startQueueWorker() {

    }
}