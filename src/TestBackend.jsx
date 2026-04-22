import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  ConfigProvider,
  Layout,
  Menu,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
  theme,
  Spin,
  Alert,
  List,
} from "antd";
import {
  AppstoreOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  DashboardOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const API = "http://127.0.0.1:8000";

export default function BulkFormsMainPage() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#16a34a",
          borderRadius: 14,
        },
      }}
    >
      <App>
        <BulkFormsContent />
      </App>
    </ConfigProvider>
  );
}

function BulkFormsContent() {
  const { message } = App.useApp();
  const [activePage, setActivePage] = useState("Dashboard");
  const [templates, setTemplates] = useState([]);
  const [patientFileName, setPatientFileName] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [outputFiles, setOutputFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Backend connected. Ready to work.");
  const [templateUploadFile, setTemplateUploadFile] = useState(null);
  const [patientUploadFile, setPatientUploadFile] = useState(null);

  const {
    token: { colorBgLayout, colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    loadTemplates();
    loadOutputs();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch(`${API}/templates`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error(error);
      setStatusText("Could not load templates.");
      message.error("Could not load templates.");
    }
  }

  async function loadOutputs() {
    try {
      const res = await fetch(`${API}/output-files`);
      const data = await res.json();
      setOutputFiles(data.files || []);
    } catch (error) {
      console.error(error);
      message.error("Could not load output files.");
    }
  }

  async function uploadTemplate() {
    if (!templateUploadFile) {
      message.warning("Please select a DOCX template first.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", templateUploadFile);

      const res = await fetch(`${API}/upload-template`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Template upload failed");

      setStatusText(data.message || "Template uploaded successfully.");
      message.success(data.message || "Template uploaded successfully.");
      setTemplateUploadFile(null);
      await loadTemplates();
    } catch (error) {
      console.error(error);
      setStatusText(error.message || "Template upload failed.");
      message.error(error.message || "Template upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadPatientFile() {
    if (!patientUploadFile) {
      message.warning("Please select an Excel or CSV patient file first.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", patientUploadFile);

      const res = await fetch(`${API}/upload-patient-file`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Patient file upload failed");

      setPatientFileName(data.filename || "");
      setPreviewRows(data.preview || []);
      setStatusText(data.message || "Patient file uploaded successfully.");
      setActivePage("Patients File");
      message.success(data.message || "Patient file uploaded successfully.");
    } catch (error) {
      console.error(error);
      setStatusText(error.message || "Patient file upload failed.");
      message.error(error.message || "Patient file upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function generateForms() {
    if (!patientFileName) {
      message.warning("Upload a patient file before generating forms.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: patientFileName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Generation failed");

      setStatusText(data.message || "Forms generated successfully.");
      message.success(data.message || "Forms generated successfully.");
      await loadOutputs();
      setActivePage("Output Files");
    } catch (error) {
      console.error(error);
      setStatusText(error.message || "Generation failed.");
      message.error(error.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function downloadFile(filename) {
    window.open(`${API}/download/${encodeURIComponent(filename)}`, "_blank");
  }

  function downloadAllZip() {
    window.open(`${API}/download-all-zip`, "_blank");
  }

  const stats = useMemo(
    () => [
      { title: "Templates", value: templates.length, note: "Available in backend", icon: <AppstoreOutlined /> },
      { title: "Patient File", value: patientFileName ? 1 : 0, note: patientFileName || "No file uploaded yet", icon: <FileTextOutlined /> },
      { title: "Preview Rows", value: previewRows.length, note: "Returned from upload API", icon: <FolderOpenOutlined /> },
      { title: "Output Files", value: outputFiles.length, note: "Ready for download", icon: <FileDoneOutlined /> },
    ],
    [templates.length, patientFileName, previewRows.length, outputFiles.length]
  );

  const menuItems = [
    { key: "Dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "Templates", icon: <AppstoreOutlined />, label: "Templates" },
    { key: "Patients File", icon: <UploadOutlined />, label: "Patients File" },
    { key: "Generate Forms", icon: <PlayCircleOutlined />, label: "Generate Forms" },
    { key: "Output Files", icon: <DownloadOutlined />, label: "Output Files" },
  ];

  const previewColumns = useMemo(() => {
    if (!previewRows.length) return [];
    return Object.keys(previewRows[0]).map((key) => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true,
      render: (value) => String(value ?? ""),
    }));
  }, [previewRows]);

  const previewDataSource = previewRows.map((row, index) => ({ key: index, ...row }));
  const outputDataSource = outputFiles.map((file, index) => ({ key: `${file}-${index}`, file }));
  const templateDataSource = templates.map((template, index) => ({ key: `${template}-${index}`, template }));

  function renderDashboard() {
    return (
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <Row gutter={[16, 16]}>
          {stats.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card bordered={false} style={{ height: "100%" }}>
                <Statistic title={item.title} value={item.value} prefix={item.icon} />
                <Text type="secondary">{item.note}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card title="Quick actions" bordered={false}>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <Button block size="large" icon={<AppstoreOutlined />} onClick={() => setActivePage("Templates")}>
                    Manage Templates
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  <Button block type="primary" size="large" icon={<UploadOutlined />} onClick={() => setActivePage("Patients File")}>
                    Upload Patient Sheet
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  <Button block size="large" icon={<PlayCircleOutlined />} onClick={() => setActivePage("Generate Forms")}>
                    Generate Forms
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  <Button block size="large" icon={<DownloadOutlined />} onClick={() => setActivePage("Output Files")}>
                    Download Outputs
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card title="System status" bordered={false}>
              <Alert message={statusText} type="info" showIcon />
              <List
                style={{ marginTop: 16 }}
                dataSource={[
                  `Backend URL: ${API}`,
                  `Uploaded patient file: ${patientFileName || "None"}`,
                  `Templates available: ${templates.length}`,
                  `Output files ready: ${outputFiles.length}`,
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    );
  }

  function renderTemplatesPage() {
    const templateColumns = [
      {
        title: "Template File",
        dataIndex: "template",
        key: "template",
      },
      {
        title: "Status",
        key: "status",
        render: () => <Tag color="green">Active</Tag>,
      },
    ];

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Upload template" bordered={false}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Upload
                beforeUpload={(file) => {
                  setTemplateUploadFile(file);
                  return false;
                }}
                maxCount={1}
                accept=".docx"
                onRemove={() => setTemplateUploadFile(null)}
              >
                <Button icon={<UploadOutlined />}>Choose DOCX Template</Button>
              </Upload>
              <Button type="primary" loading={loading} onClick={uploadTemplate} icon={<UploadOutlined />}>
                Upload Template
              </Button>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Use template names that match your product and client naming logic.
              </Paragraph>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Available backend templates" bordered={false}>
            <Table columns={templateColumns} dataSource={templateDataSource} pagination={{ pageSize: 6 }} />
          </Card>
        </Col>
      </Row>
    );
  }

  function renderPatientsPage() {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title="Upload patient file" bordered={false}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Upload
                beforeUpload={(file) => {
                  setPatientUploadFile(file);
                  return false;
                }}
                maxCount={1}
                accept=".xlsx,.xls,.csv"
                onRemove={() => setPatientUploadFile(null)}
              >
                <Button icon={<UploadOutlined />}>Choose Excel or CSV</Button>
              </Upload>
              <Button type="primary" loading={loading} onClick={uploadPatientFile} icon={<UploadOutlined />}>
                Upload Patient File
              </Button>
              <Card size="small">
                <Text type="secondary">Current uploaded file</Text>
                <br />
                <Text strong>{patientFileName || "No file uploaded yet"}</Text>
              </Card>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={15}>
          <Card title="Preview rows" bordered={false}>
            <Table
              columns={previewColumns}
              dataSource={previewDataSource}
              scroll={{ x: true }}
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: "Upload a patient file to see preview rows here." }}
            />
          </Card>
        </Col>
      </Row>
    );
  }

  function renderGeneratePage() {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Generate batch" bordered={false}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card size="small">
                <Statistic title="Patient file ready" value={patientFileName ? 1 : 0} suffix={patientFileName ? "loaded" : "missing"} />
              </Card>
              <Card size="small">
                <Statistic title="Templates available" value={templates.length} />
              </Card>
              <Card size="small">
                <Statistic title="Preview rows loaded" value={previewRows.length} />
              </Card>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                loading={loading}
                disabled={!patientFileName}
                onClick={generateForms}
                block
              >
                Generate Forms
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Process flow" bordered={false}>
            <List
              dataSource={[
                "Read uploaded spreadsheet from backend uploads folder",
                "Check each row for product and client values",
                "Select the matching DOCX template automatically",
                "Fill placeholders using backend filler logic",
                "Save created files into output_docx and refresh downloads",
              ]}
              renderItem={(item, index) => (
                <List.Item>
                  <Space align="start">
                    <Tag color="green">{index + 1}</Tag>
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    );
  }

  function renderOutputsPage() {
    const outputColumns = [
      {
        title: "Generated File",
        dataIndex: "file",
        key: "file",
        ellipsis: true,
      },
      {
        title: "Action",
        key: "action",
        render: (_, record) => (
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => downloadFile(record.file)}>
            Download
          </Button>
        ),
      },
    ];

    return (
      <Card
        title="Generated output files"
        bordered={false}
        extra={
          <Space>
            <Button onClick={loadOutputs}>Refresh List</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={downloadAllZip}>
              Download All ZIP
            </Button>
          </Space>
        }
      >
        <Table
          columns={outputColumns}
          dataSource={outputDataSource}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "No generated files found yet." }}
        />
      </Card>
    );
  }

  function renderPageContent() {
    switch (activePage) {
      case "Templates":
        return renderTemplatesPage();
      case "Patients File":
        return renderPatientsPage();
      case "Generate Forms":
        return renderGeneratePage();
      case "Output Files":
        return renderOutputsPage();
      default:
        return renderDashboard();
    }
  }

  return (
    <Layout style={{ minHeight: "100vh", background: colorBgLayout }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={260}
        style={{ background: "#0f172a" }}
      >
        <div style={{ padding: 20, color: "white" }}>
          <Title level={3} style={{ color: "white", margin: 0 }}>Bulk Forms</Title>
          <Text style={{ color: "#94a3b8" }}>Backend-connected dashboard</Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activePage]}
          items={menuItems}
          onClick={({ key }) => setActivePage(key)}
          style={{ background: "#0f172a", borderInlineEnd: "none" }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: "16px 24px",
            height: "auto",
            lineHeight: "normal",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Title level={2} style={{ margin: 0 }}>{activePage}</Title>
              <Text type="secondary">
                Clean Ant Design frontend connected to your existing FastAPI workflow.
              </Text>
            </Col>
            <Col>
              <Space wrap>
                <Button onClick={() => setActivePage("Templates")}>Templates</Button>
                <Button type="primary" onClick={() => setActivePage("Patients File")}>Upload Sheet</Button>
                <Button onClick={() => setActivePage("Generate Forms")}>Generate</Button>
                <Button onClick={() => setActivePage("Output Files")}>Outputs</Button>
              </Space>
            </Col>
          </Row>
        </Header>

        <Content style={{ margin: 24 }}>
          <Spin spinning={loading} tip="Working...">
            {renderPageContent()}
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
}
