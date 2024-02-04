const assert = require('assert');
const fetchMock = require("fetch-mock");
const clockInEndpoint = 'https://code-dojo/v1/clock-ins'

function sendClockIn() {
  return new Promise((resolve, reject) => {
    const clockInDateTime = Date.now().toString();
    fetch(clockInEndpoint, {
      method: 'POST',
      body: JSON.stringify({ clockInDateTime: clockInDateTime }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(() => {
      resolve('Clocked in')
    })
    .catch(error => {
      reject('Failed to clock in');
    });
  });
}

describe('time tracking', () => {
  context('only time is tracked', () => {
    beforeEach(() => {
      fetchMock.restore();
    });

    it('sends clock-in with only time data', (done) => {
      fetchMock.postOnce(clockInEndpoint, {
        body: { 'status': 'Success!' },
        headers: { 'content-type': 'application/json' }
      });
      sendClockIn()
        .then(result => {
          assert.strictEqual(result, 'Clocked in');
          done();
        })
        .catch(error => {
          assert.strictEqual(error, undefined);
        });
    });

    it('fails to send clock-in with only time data', (done) => {
      fetchMock.postOnce(clockInEndpoint, () => {
        throw new Error();
      });

      sendClockIn()
        .then(response => {
          assert.strictEqual(response, undefined);
        })
        .catch(error => {
          assert.strictEqual(error, 'Failed to clock in');
          done();
        });
    });
  });
});
