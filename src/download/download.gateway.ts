import { Logger } from "@nestjs/common";
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { Server } from "socket.io";
import { DownloadService } from "./download.service";

@WebSocketGateway()
export class DownloadGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DownloadGateway.name);

  constructor(private downloadSvc: DownloadService) {

  }
  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log("Initialized");
  }

  handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage("download")
  async downloadRequest(@MessageBody() data: any, client: any) {
    const payload = JSON.parse(data);
    this.downloadSvc.initiateDownload(payload.txnType, payload.startDate, payload.endDate, payload.userId);
  }

  @SubscribeMessage("progress")
  sendProgressUpdate(clientId: string, progress: number) {
    this.io.to(clientId).emit("progress", progress);
  }
}