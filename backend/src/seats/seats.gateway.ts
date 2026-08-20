import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SeatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SeatsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinEventRoom')
  handleJoinRoom(
    @MessageBody() data: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data && data.eventId) {
      client.join(`event:${data.eventId}`);
      this.logger.log(`Client ${client.id} joined room event:${data.eventId}`);
      return { status: 'joined', room: `event:${data.eventId}` };
    }
  }

  @SubscribeMessage('leaveEventRoom')
  handleLeaveRoom(
    @MessageBody() data: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data && data.eventId) {
      client.leave(`event:${data.eventId}`);
      this.logger.log(`Client ${client.id} left room event:${data.eventId}`);
    }
  }

  notifySeatHeld(eventId: string, seatIds: string[], userId: string, expiresAt: Date) {
    this.server.to(`event:${eventId}`).emit('seat.held', {
      eventId,
      seatIds,
      userId,
      expiresAt,
    });
  }

  notifySeatReleased(eventId: string, seatIds: string[]) {
    this.server.to(`event:${eventId}`).emit('seat.released', {
      eventId,
      seatIds,
    });
  }

  notifySeatBooked(eventId: string, seatIds: string[]) {
    this.server.to(`event:${eventId}`).emit('seat.booked', {
      eventId,
      seatIds,
    });
  }

  notifyWaitlistOffer(eventId: string, category: string, userId: string, expiresAt: Date) {
    this.server.to(`event:${eventId}`).emit('waitlist.offer_created', {
      eventId,
      category,
      userId,
      expiresAt,
    });
  }
}
