import { Response, NextFunction, Request } from "express";
import { Document, Collection } from "mongoose";
import Item from "../models/Item.model";

export let findById = (req: Request, res: Response, next: NextFunction) => {
    Item.findById(req.params.id)
        .then((doc: Document) => {
            if (!doc) {
                return res.sendStatus(404);
            }
            const data = doc.toObject();
            return res.status(200).json(data);
        })
        .catch((err: any) => next(err));
}

export let find = (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page || 1;
    const pageSize = Number(req.query.limit) || 20;
    const filter = getFilter(req);
    const scope = {
    // id: 1,
    // name: 1,
    // icon: 1,
    // buy: 1,
    // sell: 1,
    // profit: 1,
    // roi: 1,
    // demand: 1,
    // supply: 1,
    // rarity: 1,
    // level: 1,
    // buc: 1,
    // suc: 1
    };

    Item.find(filter, scope)
        .limit(pageSize)
        .then((collection: Document[]) => res.json(collection))
        .catch(err => next(err));
}


let getFilter: any = (req: Request) => {

    const filter: any = {
        name: {
            $regex: req.query.name || '',
            $options: 'i'
        },
        type: {
            $regex: req.query.type || '',
            $options: 'i'
        },
        rarity: {
            $regex: req.query.rarity || '',
            $options: 'i'
        }
    };

    if (req.query.last_id) {
        filter._id = { '$gt': req.query.last_id }
    }

    // Level
    if (req.query.minLevel) {
        filter.level = Object.assign({
            $gte: Number(req.query.minLevel)
        }, filter.level);
    }
    if (req.query.maxLevel) {
        filter.level = Object.assign({
            $lte: Number(req.query.maxLevel)
        }, filter.level);
    }
    // Buy
    if (req.query.minBuy) {
        filter.buy = Object.assign({
            $gte: Number(req.query.minBuy)
        }, filter.buy);
    }
    if (req.query.maxBuy) {
        filter.buy = Object.assign({
            $lte: Number(req.query.maxBuy)
        }, filter.buy);
    }

    // sell
    if (req.query.minSell) {
        filter.sell = Object.assign({
            $gte: Number(req.query.minSell)
        }, filter.sell);
    }
    if (req.query.maxSell) {
        filter.sell = Object.assign({
            $lte: Number(req.query.maxSell)
        }, filter.sell);
    }

    // demand
    if (req.query.minDemand) {
        filter.demand = Object.assign({
            $gte: Number(req.query.minDemand)
        }, filter.demand);
    }
    if (req.query.maxDemand) {
        filter.demand = Object.assign({
            $lte: Number(req.query.maxDemand)
        }, filter.demand);
    }

    // supply
    if (req.query.minSupply) {
        filter.supply = Object.assign({
            $gte: Number(req.query.minSupply)
        }, filter.supply);
    }
    if (req.query.maxSupply) {
        filter.supply = Object.assign({
            $lte: Number(req.query.maxSupply)
        }, filter.supply);
    }

    // profit
    if (req.query.minProfit) {
        filter.profit = Object.assign({
            $gte: Number(req.query.minProfit)
        }, filter.profit);
    }
    if (req.query.maxProfit) {
        filter.profit = Object.assign({
            $lte: Number(req.query.maxProfit)
        }, filter.profit);
    }

    // roi
    if (req.query.minROI) {
        filter.roi = Object.assign({
            $gte: Number(req.query.minROI)
        }, filter.roi);
    }
    if (req.query.maxROI) {
        filter.roi = Object.assign({
            $lte: Number(req.query.maxROI)
        }, filter.roi);
    }

    // buc
    if (req.query.minBUC) {
        filter.buc = Object.assign({
            $gte: Number(req.query.minBUC)
        }, filter.buc);
    }
    if (req.query.maxBUC) {
        filter.buc = Object.assign({
            $lte: Number(req.query.maxBUC)
        }, filter.buc);
    }

    // suc
    if (req.query.minSUC) {
        filter.suc = Object.assign({
            $gte: Number(req.query.minSUC)
        }, filter.suc);
    }
    if (req.query.maxSUC) {
        filter.suc = Object.assign({
            $lte: Number(req.query.maxSUC)
        }, filter.suc);
    }

    return filter;
}