var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const { Entity, Column } = require('typeorm');
const BaseDocument = require('../lib/quest/handler/BaseDocument.js');
let QuestEntity = class QuestEntity extends BaseDocument {
};
__decorate([
    Column(),
    __metadata("design:type", String)
], QuestEntity.prototype, "questId", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], QuestEntity.prototype, "messageSent", void 0);
__decorate([
    Column({ type: "bigint", default: 0 }),
    __metadata("design:type", Number)
], QuestEntity.prototype, "timeSolved", void 0);
QuestEntity = __decorate([
    Entity("quests")
], QuestEntity);
module.exports = QuestEntity;
