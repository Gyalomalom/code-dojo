const assert = require('assert');
const fetchMock = require('fetch-mock');
const sinon = require('sinon');
const clockInEndpoint = 'https://code-dojo/v1/clock-ins'
const gpsEndpoint = 'https://code-dojo/v1/gps'

function sendClockIn(gpsCoordinates, gpsRequired = false) {
  return new Promise((resolve, reject) => {
    if (gpsRequired && !gpsCoordinates) {
      console.warn('GPS is not available, unable to clock in')
      reject('GPS is not available');
    }

    const clockInDateTime = Date.now().toString();

    fetch(clockInEndpoint, {
      method: 'POST',
      body: getBody(clockInDateTime, gpsCoordinates),
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

function getBody(clockInDateTime, gpsCoordinates) {
  return JSON.stringify({ clockInDateTime: clockInDateTime, gpsCoordinates: gpsCoordinates });
}

function getGpsCoordinates() {
  return new Promise((resolve, reject) => {
    fetch(gpsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        resolve('47.4978789,19.0402383')
      })
      .catch(error => {
        reject('Failed to fetch GPS coordinates');
      });
  });
}

describe('time tracking', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  afterEach(() => {
    sinon.restore();
  });

  context('only time is tracked', () => {
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

  context('GPS is optional', () => {
    it('sends clock in when GPS is available', (done) => {
      fetchMock.get(gpsEndpoint, {
        headers: { 'content-type': 'application/json' }
      });

      fetchMock.postOnce(clockInEndpoint, {
        body: { 'status': 'Success!' },
        headers: { 'content-type': 'application/json' }
      });

      getGpsCoordinates()
        .then(gpsCoordinates => {
          sendClockIn(gpsCoordinates)
            .then(result => {
              assert.strictEqual(result, 'Clocked in');
              done();
            }).catch(error => {
              assert.strictEqual(error, undefined);
            });
          }).catch(error => {
           assert.strictEqual(error, undefined);
        });
    });

    it('sends clock in when GPS is not available', (done) => {
      fetchMock.get(gpsEndpoint, () => {
        throw new Error();
      });

      fetchMock.postOnce(clockInEndpoint, {
        body: { 'status': 'Success!' },
        headers: { 'content-type': 'application/json' }
      });

      getGpsCoordinates()
        .then(gpsCoordinates => {
          assert.strictEqual(gpsCoordinates, undefined);
        }).catch(error => {
          sendClockIn()
            .then(result => {
              assert.strictEqual(result, 'Clocked in');
              done();
            }).catch(error => {
              assert.strictEqual(error, undefined);
            });
        });
    });

    it('fails to send clock in when GPS is available', (done) => {
      fetchMock.get(gpsEndpoint, {
        headers: { 'content-type': 'application/json' }
      });

      fetchMock.postOnce(clockInEndpoint, () => {
        throw new Error();
      });

      getGpsCoordinates()
        .then(gpsCoordinates => {
          sendClockIn(gpsCoordinates)
            .then(result => {
              assert.strictEqual(result, undefined);
            }).catch(error => {
              assert.strictEqual(error, 'Failed to clock in');
              done();
            })
        });
    });

    it('fails to send clock in when GPS is not available', (done) => {
      fetchMock.get(gpsEndpoint, () => {
        throw new Error();
      });

      fetchMock.postOnce(clockInEndpoint, () => {
        throw new Error();
      });

      getGpsCoordinates()
        .then(gpsCoordinates => {
          assert.strictEqual(gpsCoordinates, undefined);
        }).catch(error => {
          sendClockIn()
            .then(result => {
              assert.strictEqual(result, undefined);
            }).catch(error => {
              assert.strictEqual(error, 'Failed to clock in');
              done();
            });
        });
    });
  });

   context('GPS is required', () => {
     it('sends clock in when GPS is available', (done) => {
       fetchMock.get(gpsEndpoint, {
         headers: { 'content-type': 'application/json' }
       });

       fetchMock.postOnce(clockInEndpoint, {
         body: { 'status': 'Success!' },
         headers: { 'content-type': 'application/json' }
       });

       getGpsCoordinates()
         .then(gpsCoordinates => {
           sendClockIn(gpsCoordinates)
             .then(result => {
               assert.strictEqual(result, 'Clocked in');
               done();
             }).catch(error => {
              assert.strictEqual(error, undefined);
             });
         }).catch(error => {
            assert.strictEqual(error, undefined);
         });
     });

     it('does NOT send clock-in when no GPS is available', (done) => {
       fetchMock.get(gpsEndpoint, () => {
         throw new Error();
       });

       fetchMock.postOnce(clockInEndpoint, {
         body: { 'status': 'Success!' },
         headers: { 'content-type': 'application/json' }
       });

       getGpsCoordinates()
         .then(gpsCoordinates => {
           assert.strictEqual(gpsCoordinates, undefined);
         }).catch(error => {
           sendClockIn(null, true)
             .then(result => {
               assert.strictEqual(result, undefined);
             }).catch(error => {
               assert.strictEqual(error, 'GPS is not available');
               done();
             });
         });
     });

     it('warns the user when no GPS is available', (done) => {
       const consoleStub = sinon.stub(console, 'warn');

       fetchMock.get(gpsEndpoint, () => {
         throw new Error();
       });

       fetchMock.postOnce(clockInEndpoint, {
         body: { 'status': 'Success!' },
         headers: { 'content-type': 'application/json' }
       });

       getGpsCoordinates()
         .then(gpsCoordinates => {
           assert.strictEqual(gpsCoordinates, undefined);
         }).catch(error => {
           sendClockIn(null, true)
             .then(result => {
               assert.strictEqual(result, undefined);
             }).catch(error => {
               sinon.assert.calledOnce(consoleStub);
               sinon.assert.calledWith(consoleStub, 'GPS is not available, unable to clock in');
               done();
            });
         });
     });
   });
});
