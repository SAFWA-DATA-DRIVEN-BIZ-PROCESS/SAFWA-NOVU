import { ConflictException, Injectable } from '@nestjs/common';
import {
  IntegrationEntity,
  IntegrationRepository,
  OrganizationEntity,
  OrganizationRepository,
} from '@novu/dal';
import {
  ChannelTypeEnum,
  EmailProviderIdEnum,
  SmsProviderIdEnum,
} from '@novu/shared';

import {
  CalculateLimitNovuIntegration,
  CalculateLimitNovuIntegrationCommand,
} from '../calculate-limit-novu-integration';
import { GetNovuIntegrationCommand } from './get-novu-integration.command';
import { AnalyticsService } from '../../services';

@Injectable()
export class GetNovuIntegration {
  constructor(
    private integrationRepository: IntegrationRepository,
    private calculateLimitNovuIntegration: CalculateLimitNovuIntegration,
    private organizationRepository: OrganizationRepository,
    private analyticsService: AnalyticsService
  ) {}

  async execute(
    command: GetNovuIntegrationCommand
  ): Promise<IntegrationEntity | undefined> {
    const channelType = command.channelType;

    if (
      channelType === ChannelTypeEnum.EMAIL &&
      !process.env.NOVU_EMAIL_INTEGRATION_API_KEY
    ) {
      return;
    }

    if (
      channelType === ChannelTypeEnum.SMS &&
      !process.env.NOVU_SMS_INTEGRATION_ACCOUNT_SID &&
      !process.env.NOVU_SMS_INTEGRATION_TOKEN &&
      !process.env.NOVU_SMS_INTEGRATION_SENDER
    ) {
      return;
    }

    const activeIntegrationsCount = await this.integrationRepository.count({
      _organizationId: command.organizationId,
      active: true,
      channel: channelType,
      _environmentId: command.environmentId,
    });

    if (activeIntegrationsCount > 0) {
      return;
    }

    const limit = await this.calculateLimitNovuIntegration.execute(
      CalculateLimitNovuIntegrationCommand.create({
        channelType: channelType,
        organizationId: command.organizationId,
        environmentId: command.environmentId,
      })
    );

    if (!limit) {
      return;
    }

    if (limit.count >= limit.limit) {
      this.analyticsService.track(
        '[Novu Integration] - Limit reached',
        command.userId,
        {
          channelType,
          organizationId: command.organizationId,
          environmentId: command.environmentId,
          providerId: CalculateLimitNovuIntegration.getProviderId(
            command.channelType
          ),
          ...limit,
        }
      );
      throw new ConflictException(
        `Limit for Novus ${channelType.toLowerCase()} provider was reached.`
      );
    }

    const organization = await this.organizationRepository.findById(
      command.organizationId
    );

    switch (command.channelType) {
      case ChannelTypeEnum.EMAIL:
        return this.createNovuEmailIntegration(organization);
      case ChannelTypeEnum.SMS:
        return this.createNovuSMSIntegration();
      default:
        return undefined;
    }
  }

  private createNovuEmailIntegration(
    organization: OrganizationEntity | null
  ): IntegrationEntity {
    const item = new IntegrationEntity();
    item.providerId = EmailProviderIdEnum.Novu;
    item.active = true;
    item.channel = ChannelTypeEnum.EMAIL;

    item.credentials = {
      apiKey: process.env.NOVU_EMAIL_INTEGRATION_API_KEY,
      from: 'no-reply@novu.co',
      senderName: organization !== null ? organization.name : 'Novu',
      ipPoolName: 'Demo',
    };

    return item;
  }

  private createNovuSMSIntegration(): IntegrationEntity {
    const item = new IntegrationEntity();
    item.providerId = SmsProviderIdEnum.Novu;
    item.active = true;
    item.channel = ChannelTypeEnum.SMS;

    item.credentials = {
      accountSid: process.env.NOVU_SMS_INTEGRATION_ACCOUNT_SID,
      token: process.env.NOVU_SMS_INTEGRATION_TOKEN,
      from: process.env.NOVU_SMS_INTEGRATION_SENDER,
    };

    return item;
  }

  public static mapProviders(type: ChannelTypeEnum, providerId: string) {
    if (
      ![
        EmailProviderIdEnum.Novu.toString(),
        SmsProviderIdEnum.Novu.toString(),
      ].includes(providerId)
    ) {
      return providerId;
    }

    switch (type) {
      case ChannelTypeEnum.EMAIL:
        return EmailProviderIdEnum.SendGrid;
      case ChannelTypeEnum.SMS:
        return SmsProviderIdEnum.Twilio;
      default:
        return providerId;
    }
  }
}
