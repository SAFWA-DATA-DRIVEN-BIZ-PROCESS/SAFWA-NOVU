import { expect } from 'chai';
import { UserSession, NotificationTemplateService } from '@novu/testing';
import {
  NotificationGroupRepository,
  NotificationTemplateRepository,
  EnvironmentRepository,
  MessageTemplateRepository,
  ChannelTypeEnum,
} from '@novu/dal';
import { ChannelCTATypeEnum } from '@novu/shared';

describe('Delete notification template by id - /notification-templates/:templateId (DELETE)', async () => {
  let session: UserSession;
  const notificationTemplateRepository = new NotificationTemplateRepository();
  const notificationGroupRepository: NotificationGroupRepository = new NotificationGroupRepository();
  const environmentRepository: EnvironmentRepository = new EnvironmentRepository();
  const messageTemplateRepository: MessageTemplateRepository = new MessageTemplateRepository();

  before(async () => {
    session = new UserSession();
    await session.initialize();
  });

  it('should delete the notification template', async function () {
    const notificationTemplateService = new NotificationTemplateService(
      session.user._id,
      session.organization._id,
      session.environment._id
    );
    const template = await notificationTemplateService.createTemplate();

    await session.testAgent.delete(`/v1/notification-templates/${template._id}`).send();

    const isDeleted = !(await notificationTemplateRepository.findOne({
      _environmentId: session.environment._id,
      _id: template._id,
    }));

    expect(isDeleted).to.equal(true);

    const deletedIntegration = (
      await notificationTemplateRepository.findDeleted({ _environmentId: session.environment._id, _id: template._id })
    )[0];

    expect(deletedIntegration.deleted).to.equal(true);
  });

  it('should delete the production notification template', async function () {
    const groups = await notificationGroupRepository.find({
      _environmentId: session.environment._id,
    });

    const testTemplate = {
      name: 'test email template',
      description: 'This is a test description',
      tags: ['test-tag'],
      notificationGroupId: groups[0]._id,
      steps: [],
    };

    const { body } = await session.testAgent.post(`/v1/notification-templates`).send(testTemplate);
    const notificationTemplateId = body.data._id;

    await session.applyChanges({
      enabled: false,
    });

    const prodEvn = await getProductionEnvironment(session.environment._id);

    const isCreated = await notificationTemplateRepository.findOne({
      _environmentId: prodEvn._id,
      _parentId: notificationTemplateId,
    });

    expect(isCreated).to.exist;

    await session.testAgent.delete(`/v1/notification-templates/${notificationTemplateId}`).send();

    const {
      body: { data },
    } = await session.testAgent.get(`/v1/changes?promoted=false`);

    expect(data[0].templateName).to.eq(body.data.name);

    await session.applyChanges({
      enabled: false,
    });

    const isDeleted = await notificationTemplateRepository.findOne({
      _environmentId: prodEvn._id,
      _parentId: notificationTemplateId,
    });

    expect(!isDeleted).to.equal(true);
  });

  it('should only make one change on delete', async function () {
    const groups = await notificationGroupRepository.find({
      _environmentId: session.environment._id,
    });

    const testTemplate = {
      name: 'test email template',
      description: 'This is a test description',
      tags: ['test-tag'],
      notificationGroupId: groups[0]._id,
      steps: [],
    };

    const { body } = await session.testAgent.post(`/v1/notification-templates`).send(testTemplate);
    const notificationTemplateId = body.data._id;

    await session.testAgent.delete(`/v1/notification-templates/${notificationTemplateId}`).send();

    const {
      body: { data },
    } = await session.testAgent.get(`/v1/changes?promoted=false`);

    expect(data[0].templateName).to.eq(body.data.name);
    expect(data.length).to.eq(1);
  });

  it('should not display on listing notification templates', async function () {
    const notificationTemplateService = new NotificationTemplateService(
      session.user._id,
      session.organization._id,
      session.environment._id
    );

    const template1 = await notificationTemplateService.createTemplate();
    await notificationTemplateService.createTemplate();
    await notificationTemplateService.createTemplate();

    const { body: templates } = await session.testAgent.get(`/v1/notification-templates`);
    expect(templates.data.length).to.equal(3);

    await session.testAgent.delete(`/v1/notification-templates/${template1._id}`).send();

    const { body: templatesAfterDelete } = await session.testAgent.get(`/v1/notification-templates`);

    expect(templatesAfterDelete.data.length).to.equal(2);
  });

  it('should fail for non-existing notification template', async function () {
    const dummyId = '5f6651112efc19f33b34fc39';
    const response = await session.testAgent.delete(`/v1/notification-templates/${dummyId}`).send();

    expect(response.body.message).to.contains('Could not find workflow with id');
  });

  it('should delete the notification template along with the message templates', async function () {
    const notificationTemplateService = new NotificationTemplateService(
      session.user._id,
      session.organization._id,
      session.environment._id
    );
    const template = await notificationTemplateService.createTemplate();

    const messageTemplateIds = template.steps.map((step) => step._templateId);

    const messageTemplates = await messageTemplateRepository.find({
      _environmentId: session.environment._id,
      _id: { $in: messageTemplateIds },
    });

    expect(messageTemplates.length).to.equal(2);

    await session.testAgent.delete(`/v1/notification-templates/${template._id}`).send();

    const deletedNotificationTemplate = await notificationTemplateRepository.findOne({
      _environmentId: session.environment._id,
      _id: template._id,
    });

    expect(deletedNotificationTemplate).to.equal(null);

    const deletedIntegration = (
      await notificationTemplateRepository.findDeleted({ _environmentId: session.environment._id, _id: template._id })
    )[0];

    expect(deletedIntegration.deleted).to.equal(true);

    const deletedMessageTemplates = await messageTemplateRepository.find({
      _environmentId: session.environment._id,
      _id: { $in: messageTemplateIds },
    });

    expect(deletedMessageTemplates.length).to.equal(0);
  });

  it('should delete the production message templates', async function () {
    const groups = await notificationGroupRepository.find({
      _environmentId: session.environment._id,
    });

    const testTemplate = {
      name: 'test email template',
      description: 'This is a test description',
      tags: ['test-tag'],
      notificationGroupId: groups[0]._id,
      steps: [
        {
          template: {
            type: ChannelTypeEnum.IN_APP,
            content: 'Test content for <b>{{firstName}}</b>',
            cta: {
              type: ChannelCTATypeEnum.REDIRECT,
              data: {
                url: '/cypress/test-shell/example/test?test-param=true',
              },
            },
            variables: [
              {
                defaultValue: '',
                name: 'firstName',
                required: false,
                type: 'String',
              },
            ],
          },
        },
      ],
    };

    const { body } = await session.testAgent.post(`/v1/notification-templates`).send(testTemplate);
    const notificationTemplate = body.data;

    const notificationTemplateId = body.data._id;

    const messageTemplateId = notificationTemplate.steps[0]._templateId;

    await session.applyChanges({
      enabled: false,
    });

    const prodEvn = await getProductionEnvironment(session.environment._id);

    const isNotificationTemplatePromoted = await notificationTemplateRepository.findOne({
      _environmentId: prodEvn._id,
      _parentId: notificationTemplateId,
    });

    expect(isNotificationTemplatePromoted).to.exist;

    const isMessageTemplatePromoted = await messageTemplateRepository.findOne({
      _environmentId: prodEvn._id,
      _parentId: messageTemplateId,
    });

    expect(isMessageTemplatePromoted).to.exist;

    await session.testAgent.delete(`/v1/notification-templates/${notificationTemplateId}`).send();

    const {
      body: { data },
    } = await session.testAgent.get(`/v1/changes?promoted=false`);

    expect(data[0].templateName).to.eq(body.data.name);

    await session.applyChanges({
      enabled: false,
    });

    const isNotificationTemplateExists = await notificationTemplateRepository.findOne({
      _environmentId: prodEvn._id,
      _parentId: notificationTemplateId,
    });

    expect(isNotificationTemplateExists).to.not.exist;

    const isMessageTemplateExists = await notificationTemplateRepository.findOne({
      _environmentId: prodEvn._id,
      _parentId: messageTemplateId,
    });

    expect(isMessageTemplateExists).to.not.exist;
  });

  async function getProductionEnvironment(currentEnvId: string) {
    return await environmentRepository.findOne({
      _parentId: currentEnvId,
    });
  }
});
