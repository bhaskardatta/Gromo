"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
var notFound = function (req, res) {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: "Route ".concat(req.originalUrl, " not found")
        }
    });
};
exports.notFound = notFound;
