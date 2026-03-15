import { Row, Col, Spin, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';

export default function PredictionCard({ title, isLoading = false, prediction = 0, trend = 'neutral' }) {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();

  return (
    <Col className="gutter-row" xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 6 }}>
      <div
        className="whiteBox shadow"
        style={{ color: '#595959', fontSize: 13, height: '106px', padding: '15px' }}
      >
        <div style={{ color: '#8c8c8c' }}>{translate(title)}</div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center' }}>
          {isLoading ? (
            <Spin />
          ) : (
             <Statistic
               value={prediction}
               precision={2}
               valueStyle={{
                 color: trend === 'up' ? '#3f8600' : trend === 'down' ? '#cf1322' : '#8c8c8c',
                 fontSize: '24px'
               }}
               prefix={
                 trend === 'up' ? (
                   <ArrowUpOutlined />
                 ) : trend === 'down' ? (
                   <ArrowDownOutlined />
                 ) : (
                   <MinusOutlined />
                 )
               }
               formatter={(val) => moneyFormatter({ amount: val })}
            />
          )}
        </div>
      </div>
    </Col>
  );
}
