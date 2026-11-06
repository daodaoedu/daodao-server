import { installSupertestLoopback } from '../../../utils/supertest-loopback';
import nock from 'nock';

installSupertestLoopback();
nock.disableNetConnect();
nock.enableNetConnect(host => /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host));
