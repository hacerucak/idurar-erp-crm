import { List, Typography, Spin, Col } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Text } = Typography;

export default function InventoryAIWidget({ isLoading = false, predictions = [] }) {
  const translate = useLanguage();

  return (
    <div className="whiteBox shadow pad20" style={{ height: '100%' }}>
      <h3 style={{ color: '#22075e', marginBottom: 15 }}>
        <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
        Yapay Zeka Stok Önerileri (Makine Öğrenmesi Simülasyonu)
      </h3>
      {isLoading ? (
        <Spin />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={predictions}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<span style={{ fontWeight: '500' }}>{item.itemName}</span>}
                description={<Text type="danger">{item.suggestion}</Text>}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Şu an stok uyarısı yok.' }}
        />
      )}
    </div>
  );
}
