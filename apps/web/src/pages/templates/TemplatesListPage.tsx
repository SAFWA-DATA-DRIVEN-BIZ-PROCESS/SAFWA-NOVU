import { useState } from 'react';
import { Badge, ActionIcon, useMantineTheme } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { ColumnWithStrictAccessor } from 'react-table';
import styled from '@emotion/styled';
import { format } from 'date-fns';

import { useTemplates, useEnvController, useNotificationGroup, useIsTemplateStoreEnabled } from '../../hooks';
import PageMeta from '../../components/layout/components/PageMeta';
import PageHeader from '../../components/layout/components/PageHeader';
import PageContainer from '../../components/layout/components/PageContainer';
import { Tag, Table, colors, Text, Button, LoadingOverlay } from '../../design-system';
import { Edit, PlusCircle } from '../../design-system/icons';
import { Tooltip } from '../../design-system';
import { Data } from '../../design-system/table/Table';
import { ROUTES } from '../../constants/routes.enum';
import { parseUrl } from '../../utils/routeUtils';
import { TemplatesListNoData } from './TemplatesListNoData';
import { useSegment } from '../../components/providers/SegmentProvider';
import { TemplateAnalyticsEnum } from './constants';
import { useTemplatesStoreModal } from './hooks/useTemplatesStoreModal';
import { useFetchBlueprints, useCreateTemplateFromBlueprint } from '../../api/hooks';
import { CreateWorkflowDropdown } from './components/CreateWorkflowDropdown';
import { IBlueprintTemplate } from '../../api/types';
import { errorMessage } from '../../utils/notifications';
import { TemplateCreationSourceEnum } from './shared';
import { TemplatesListNoDataOld } from './TemplatesListNoDataOld';
import { useCreateDigestDemoWorkflow } from '../../api/hooks/notification-templates/useCreateDigestDemoWorkflow';
import { When } from '../../components/utils/When';

function NotificationList() {
  const segment = useSegment();
  const { readonly } = useEnvController();
  const [page, setPage] = useState<number>(0);
  const { loading: areNotificationGroupLoading } = useNotificationGroup();
  const { templates, loading: isLoading, totalCount: totalTemplatesCount, pageSize } = useTemplates(page);
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const { blueprintsGroupedAndPopular: { general, popular } = {}, isLoading: areBlueprintsLoading } =
    useFetchBlueprints();
  const { createTemplateFromBlueprint, isLoading: isCreatingTemplateFromBlueprint } = useCreateTemplateFromBlueprint({
    onSuccess: (template) => {
      navigate(`${parseUrl(ROUTES.WORKFLOWS_EDIT_TEMPLATEID, { templateId: template._id ?? '' })}`);
    },
    onError: () => {
      errorMessage('Something went wrong while creating template from blueprint, please try again later.');
    },
  });
  const hasGroups = general && general.length > 0;
  const hasTemplates = templates && templates.length > 0;

  const { TemplatesStoreModal, openModal } = useTemplatesStoreModal({ general, popular });
  const { createDigestDemoWorkflow, isDisabled: isTryDigestDisabled } = useCreateDigestDemoWorkflow();
  const isTemplateStoreEnabled = useIsTemplateStoreEnabled();

  function handleTableChange(pageIndex) {
    setPage(pageIndex);
  }

  const handleRedirectToCreateTemplate = (isFromHeader: boolean) => {
    segment.track(TemplateAnalyticsEnum.CREATE_TEMPLATE_CLICK, { isFromHeader });
    navigate(ROUTES.WORKFLOWS_CREATE);
  };

  const handleOnBlueprintClick = (blueprint: IBlueprintTemplate) => {
    createTemplateFromBlueprint({
      blueprint: { ...blueprint },
      params: { __source: TemplateCreationSourceEnum.TEMPLATE_STORE },
    });
  };

  const handleCreateDigestDemoWorkflow = () => {
    segment.track(TemplateAnalyticsEnum.TRY_DIGEST_CLICK);
    createDigestDemoWorkflow();
  };

  const columns: ColumnWithStrictAccessor<Data>[] = [
    {
      accessor: 'identifier',
      Header: 'Trigger ID',
      Cell: ({ triggers }: any) => (
        <Tooltip label={triggers ? triggers[0].identifier : 'Unknown'}>
          <Text rows={1}>{triggers ? triggers[0].identifier : 'Unknown'}</Text>
        </Tooltip>
      ),
    },
    {
      accessor: 'name',
      Header: 'Name',
      Cell: ({ name }: any) => (
        <Tooltip label={name}>
          <Text rows={1}>{name}</Text>
        </Tooltip>
      ),
    },
    {
      accessor: 'notificationGroup.name',
      Header: 'Category',
      Cell: ({ notificationGroup }: any) => <Tag data-test-id="category-label"> {notificationGroup?.name}</Tag>,
    },
    {
      accessor: 'createdAt',
      Header: 'Created At',
      Cell: ({ createdAt }: any) => <Text rows={1}>{format(new Date(createdAt), 'dd/MM/yyyy HH:mm')}</Text>,
    },
    {
      accessor: 'status',
      Header: 'Status',
      width: 125,
      maxWidth: 125,
      Cell: ({ draft, active }: any) => (
        <>
          {draft ? (
            <Badge variant="outline" size="md" color="yellow">
              Disabled
            </Badge>
          ) : null}{' '}
          {active ? (
            <Badge variant="outline" size="md" color="green" data-test-id="active-status-label">
              Active
            </Badge>
          ) : null}{' '}
        </>
      ),
    },
    {
      accessor: '_id',
      Header: '',
      maxWidth: 50,
      Cell: ({ _id }: any) => (
        <ActionButtonWrapper>
          <ActionIcon
            variant="transparent"
            component={Link}
            to={parseUrl(ROUTES.WORKFLOWS_EDIT_TEMPLATEID, { templateId: _id })}
            data-test-id="template-edit-link"
          >
            <Edit color={theme.colorScheme === 'dark' ? colors.B40 : colors.B80} />
          </ActionIcon>
        </ActionButtonWrapper>
      ),
    },
  ];

  function onRowClick(row) {
    navigate(parseUrl(ROUTES.WORKFLOWS_EDIT_TEMPLATEID, { templateId: row.values._id }));
  }

  return (
    <PageContainer>
      <PageMeta title="Workflows" />
      <PageHeader
        title="Workflows"
        actions={
          isTemplateStoreEnabled ? (
            <CreateWorkflowDropdown
              readonly={readonly}
              blueprints={popular?.blueprints}
              isLoading={areBlueprintsLoading}
              isCreating={isCreatingTemplateFromBlueprint}
              allTemplatesDisabled={areBlueprintsLoading || !hasGroups}
              onBlankWorkflowClick={() => handleRedirectToCreateTemplate(false)}
              onTemplateClick={handleOnBlueprintClick}
              onAllTemplatesClick={openModal}
            />
          ) : (
            <Button
              disabled={readonly}
              onClick={() => handleRedirectToCreateTemplate(true)}
              icon={<PlusCircle />}
              data-test-id="create-template-btn"
            >
              Create Workflow
            </Button>
          )
        }
      />

      <TemplateListTableWrapper>
        <LoadingOverlay visible={isLoading}>
          <When truthy={!isLoading}>
            {isTemplateStoreEnabled ? (
              <>
                <When truthy={hasTemplates}>
                  <Table
                    onRowClick={onRowClick}
                    loading={areNotificationGroupLoading}
                    data-test-id="notifications-template"
                    columns={columns}
                    data={templates}
                    pagination={{
                      pageSize: pageSize,
                      current: page,
                      total: totalTemplatesCount,
                      onPageChange: handleTableChange,
                    }}
                  />
                </When>
                <When truthy={!hasTemplates}>
                  <TemplatesListNoData
                    readonly={readonly}
                    blueprints={popular?.blueprints}
                    isLoading={areBlueprintsLoading}
                    isCreating={isCreatingTemplateFromBlueprint}
                    allTemplatesDisabled={areBlueprintsLoading || !hasGroups}
                    onBlankWorkflowClick={() => handleRedirectToCreateTemplate(false)}
                    onTemplateClick={handleOnBlueprintClick}
                    onAllTemplatesClick={openModal}
                  />
                </When>
              </>
            ) : (
              <Table
                onRowClick={onRowClick}
                loading={areNotificationGroupLoading}
                data-test-id="notifications-template"
                columns={columns}
                data={templates}
                pagination={{
                  pageSize: pageSize,
                  current: page,
                  total: totalTemplatesCount,
                  onPageChange: handleTableChange,
                }}
                noDataPlaceholder={
                  <TemplatesListNoDataOld
                    onCreateClick={() => handleRedirectToCreateTemplate(false)}
                    onTryDigestClick={handleCreateDigestDemoWorkflow}
                    tryDigestDisabled={isTryDigestDisabled}
                  />
                }
              />
            )}
          </When>
        </LoadingOverlay>
        <TemplatesStoreModal />
      </TemplateListTableWrapper>
    </PageContainer>
  );
}

export default NotificationList;

const ActionButtonWrapper = styled.div`
  text-align: right;

  a {
    display: inline-block;
    opacity: 0;
    transition: opacity 0.1s ease-in;
  }
`;

const TemplateListTableWrapper = styled.div`
  tr:hover {
    cursor: pointer;

    ${ActionButtonWrapper} {
      a {
        opacity: 1;
      }
    }
  }
`;
