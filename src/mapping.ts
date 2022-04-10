import {
    TransferBatch,
    TransferSingle,
} from "../generated/ERC1155Proxy/ERC1155Proxy"
import {MultiToken, TransferEvent} from "../generated/schema"
import {log} from "@graphprotocol/graph-ts"
import {dayMonthYearFromEventTimestamp} from "./utils/DateConverter";

export function handleTransferBatch(event: TransferBatch): void {
    log.info('emit TransferBatch event with params[operator={} from={} tos={} id={} values={}]', [
        event.params.operator.toHex(),
        event.params.from.toHex(),
        event.params.to.toHex(),
        event.params.ids.toString(),
        event.params.values.toString()
    ])

    // from 和 to 的 id 生成规则
    let from = event.params.from.toHex()
    let to = event.params.to.toHex()
    const len = event.params.ids.length
    for (let i = 0; i < len; i++) {
        let idFrom = from + "-" + event.params.ids[i]
        let idTo = to + "-" + event.params.ids[i]

        // from 地址减少 token 数量
        let fromRecord = MultiToken.load(idFrom)
        if (fromRecord != null) {
            fromRecord.count = fromRecord.count.minus(event.params.values[i])
            fromRecord.save()
        }

        // to 地址增加 token 数量
        let toRecord = MultiToken.load(idTo)
        if (toRecord == null) {
            toRecord = new MultiToken(idTo)
            toRecord.tokenId = event.params.ids[i]
            toRecord.count = event.params.values[i]
            toRecord.owner = event.params.to
            toRecord.save()
        } else {
            toRecord.count = toRecord.count.plus(event.params.values[i])
            toRecord.save()
        }
    }

    // 保存，供调试用
    let eid = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let dateTime = dayMonthYearFromEventTimestamp(event)
    let e = new TransferEvent(eid)
    e.operator = event.params.operator
    e.fromAddr = event.params.from
    e.toAddr = event.params.to
    e.ids = event.params.ids.toString()
    e.values = event.params.values.toString()
    e.blockNumber = event.block.number
    e.emitTime = dateTime
    e.save()
}

export function handleTransferSingle(event: TransferSingle): void {
    log.info('emit TransferSingle event with params[operator={} from={} to={} id={} value={}]', [
        event.params.operator.toHex(),
        event.params.from.toHex(),
        event.params.to.toHex(),
        event.params.id.toString(),
        event.params.value.toString()
    ])

    // from 和 to 的 id 生成规则
    let idFrom = event.params.from.toHex() + "-" + event.params.id
    let idTo = event.params.to.toHex() + "-" + event.params.id

    // from 地址减少 token 数量
    let fromRecord = MultiToken.load(idFrom)
    if (fromRecord != null) {
        fromRecord.count = fromRecord.count.minus(event.params.value)
        fromRecord.save()
    }

    // to 地址增加 token 数量
    let toRecord = MultiToken.load(idTo)
    if (toRecord == null) {
        toRecord = new MultiToken(idTo)
        toRecord.tokenId = event.params.id
        toRecord.count = event.params.value
        toRecord.owner = event.params.to
        toRecord.save()
    } else {
        toRecord.count = toRecord.count.plus(event.params.value)
        toRecord.save()
    }

    // 保存，供调试用
    let eid = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let dateTime = dayMonthYearFromEventTimestamp(event)
    let e = new TransferEvent(eid)
    e.operator = event.params.operator
    e.fromAddr = event.params.from
    e.toAddr = event.params.to
    e.ids = event.params.id.toString()
    e.values = event.params.value.toString()
    e.blockNumber = event.block.number
    e.emitTime = dateTime
    e.save()
}
